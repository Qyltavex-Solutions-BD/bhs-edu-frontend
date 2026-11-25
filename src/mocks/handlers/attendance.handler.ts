import { db, clone, uid, nowIso, addAudit, sameName } from '../state';
import {
  AcademicEventType,
  AttendanceMethod,
  AttendanceSmsType,
  AttendanceStatus,
  CardStatus,
  EnrollmentStatus,
  SmsStatus,
  StudentStatus,
} from '@/src/types/enums';
import type {
  Attendance,
  AttendanceSmsLog,
} from '@/src/types/entities';
import type { ClassAttendanceMethodConfig } from '@/src/types/proposed/future';
import type { MockHandlerResult } from './types';
import { studentError } from './helpers';

function localTodayIso() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function attendanceDayError(date: string, academicYearId: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'তারিখ সঠিক নয়। / The date is not valid.';
  if (!db.academicYears.some((year) => year.id === academicYearId)) {
    return 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year was not found.';
  }
  if (date > localTodayIso()) {
    return 'আগামী তারিখে হাজিরা হয় না। / Attendance cannot be marked for a future date.';
  }
  const weekday = new Date(`${date}T12:00:00`).getDay();
  if (weekday === 5 || weekday === 6) return 'শুক্র ও শনিবার বিদ্যালয় বন্ধ। / The school is closed on Friday and Saturday.';
  const holiday = db.academicEvents.find(
    (event) =>
      event.academicYearId === academicYearId &&
      event.eventType === AcademicEventType.HOLIDAY &&
      event.startDate.slice(0, 10) <= date &&
      event.endDate.slice(0, 10) >= date
  );
  if (holiday) return `ছুটি: ${holiday.title}। / Holiday: ${holiday.title}.`;
  return null;
}

function queueAttendanceSms(
  attendanceId: string,
  studentId: string,
  classId: string,
  date: string,
  kind: 'ABSENT' | 'ENTRY' | 'EXIT'
) {
  const config = db.classAttendanceConfigs.find((item) => item.classId === classId);
  if (kind === 'ABSENT' && config && !config.autoSmsOnAbsent) return 0;
  if (kind === 'ENTRY' && !config?.autoSmsOnEntry) return 0;
  if (kind === 'EXIT' && !config?.autoSmsOnExit) return 0;
  const student = db.students.find((item) => item.id === studentId);
  if (!student) return 0;
  const smsType = kind === 'ENTRY' ? AttendanceSmsType.ENTRY : kind === 'EXIT' ? AttendanceSmsType.EXIT : AttendanceSmsType.ABSENT;
  let queued = 0;
  db.parentStudents
    .filter((link) => link.studentId === studentId && link.isSmsReceiver)
    .forEach((link) => {
      const parent = db.parents.find((item) => item.id === link.parentId);
      if (!parent) return;
      if (db.attendanceSmsLogs.some((row) => row.attendanceId === attendanceId && row.parentId === parent.id && row.smsType === smsType)) return;
      const verb = kind === 'ABSENT' ? 'অনুপস্থিত' : kind === 'ENTRY' ? 'প্রবেশ করেছে' : 'প্রস্থান করেছে';
      db.attendanceSmsLogs.unshift({
        id: uid('sms'),
        attendanceId,
        parentId: parent.id,
        smsType,
        phone: parent.phone,
        message: `প্রিয় অভিভাবক, ${student.nameBn || student.nameEn} আজ (${date}) বিদ্যালয়ে ${verb}। - ভোজেশ্বর উচ্চ বিদ্যালয়`,
        status: SmsStatus.SENT,
        sentAt: nowIso(),
        createdAt: nowIso(),
      });
      queued += 1;
    });
  return queued;
}


export function handleAttendanceMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
    if (endpoint === '/attendance/batch' && method === 'POST') {
      const { date, entries, markedBy, academicYearId } = body as {
        date: string;
        markedBy: string;
        academicYearId: string;
        entries: Array<{
          studentEnrollmentId: string;
          status: AttendanceStatus;
          method: AttendanceMethod;
          remarks?: string;
        }>;
      };
      const closed = attendanceDayError(date, academicYearId);
      if (closed) return studentError(400, closed);
      if (!entries.length) return studentError(400, 'হাজিরার সারি নেই। / There are no attendance rows.');
      let smsQueued = 0;
      for (const entry of entries) {
        const enrollment = db.enrollments.find((item) => item.id === entry.studentEnrollmentId);
        if (!enrollment || enrollment.academicYearId !== academicYearId || enrollment.status !== EnrollmentStatus.ACTIVE) {
          return studentError(400, 'শুধু এই শিক্ষাবর্ষের চলতি ভর্তিতে হাজিরা হয়। / Attendance is only for an active enrollment in this year.');
        }
        const student = db.students.find((item) => item.id === enrollment.studentId);
        if (!student || student.status !== StudentStatus.ACTIVE) {
          return studentError(400, 'সক্রিয় শিক্ষার্থী ছাড়া হাজিরা হয় না। / Only an active student can be marked.');
        }
        const existing = db.attendances.find((item) => item.studentEnrollmentId === entry.studentEnrollmentId && item.date === date);
        const attId = existing?.id ?? uid('att');
        if (existing) {
          existing.status = entry.status;
          existing.method = entry.method;
          if (entry.remarks !== undefined) {
            existing.remarks = entry.remarks.trim() ? entry.remarks.trim() : null;
          }
          if (entry.status === AttendanceStatus.ABSENT || entry.status === AttendanceStatus.LEAVE) {
            existing.inTime = null;
            existing.outTime = null;
          } else if (!existing.inTime) {
            existing.inTime =
              entry.status === AttendanceStatus.LATE ? `${date}T10:25:00` : `${date}T09:55:00`;
          }
          existing.markedBy = markedBy;
          existing.updatedAt = nowIso();
        } else {
          db.attendances.push({
            id: attId,
            studentEnrollmentId: entry.studentEnrollmentId,
            date,
            inTime: entry.status === AttendanceStatus.LATE ? `${date}T10:25:00` : entry.status === AttendanceStatus.PRESENT ? `${date}T09:55:00` : null,
            outTime: null,
            status: entry.status,
            method: entry.method,
            remarks: entry.remarks?.trim() ? entry.remarks.trim() : null,
            markedBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
        }
        if (entry.status === AttendanceStatus.ABSENT) smsQueued += queueAttendanceSms(attId, enrollment.studentId, enrollment.classId, date, 'ABSENT');
      }
      addAudit('ATTENDANCE_MARK', 'Attendance', `Marked attendance for ${entries.length} students on ${date}.`, markedBy);
      return { data: { saved: entries.length, smsQueued } };
    }

    if (endpoint === '/attendance/sms/retry' && method === 'POST') {
      const { id } = body as { id: string };
      const sms = db.attendanceSmsLogs.find((item) => item.id === id);
      if (!sms) return studentError(404, 'এসএমএস পাওয়া যায়নি। / SMS was not found.');
      if (sms.status !== SmsStatus.FAILED) return studentError(400, 'শুধু ব্যর্থ এসএমএস আবার পাঠানো যায়। / Only a failed SMS can be sent again.');
      sms.status = SmsStatus.SENT;
      sms.sentAt = nowIso();
      addAudit('ATTENDANCE_SMS_RETRY', 'Attendance', `Retried failed attendance SMS (${sms.id}) to ${sms.phone}.`);
      return { data: clone(sms) };
    }

    if (endpoint === '/attendance/sms/retry-all' && method === 'POST') {
      const failed = db.attendanceSmsLogs.filter((item) => item.status === SmsStatus.FAILED);
      if (!failed.length) {
        return studentError(400, 'পুনরায় পাঠানোর মতো কোনো ব্যর্থ এসএমএস নেই। / There are no failed SMS messages to retry.');
      }
      const sentTime = nowIso();
      failed.forEach((sms) => {
        sms.status = SmsStatus.SENT;
        sms.sentAt = sentTime;
      });
      addAudit('ATTENDANCE_SMS_RETRY_ALL', 'Attendance', `Retried ${failed.length} failed attendance SMS messages.`);
      return { data: { retried: failed.length } };
    }

    if (endpoint === '/attendance/config' && method === 'PUT') {
      const updated = body as ClassAttendanceMethodConfig;
      if (!db.classes.some((item) => item.id === updated.classId)) {
        return studentError(404, 'শ্রেণি পাওয়া যায়নি। / Class was not found.');
      }
      if (updated.method !== AttendanceMethod.MANUAL && updated.method !== AttendanceMethod.RFID) {
        return studentError(400, 'হাজিরা হয় হাতে অথবা RFID কার্ডে। / Attendance is manual or by RFID card.');
      }
      const lateThresholdTime = (updated.lateThresholdTime || '').slice(0, 5);
      if (!/^\d{2}:\d{2}$/.test(lateThresholdTime)) {
        return studentError(400, 'দেরির সময় ১০:১৫ এই বিন্যাসে দিন। / Late time must look like 10:15.');
      }
      const next = { ...updated, lateThresholdTime, method: updated.method };
      const idx = db.classAttendanceConfigs.findIndex((item) => item.classId === next.classId);
      if (idx >= 0) db.classAttendanceConfigs[idx] = next;
      else db.classAttendanceConfigs.push(next);
      addAudit('ATTENDANCE_CONFIG', 'Attendance', `Updated attendance method for ${next.classId} to ${next.method}.`);
      return { data: clone(next) };
    }

    if (endpoint === '/attendance/rfid/simulate' && method === 'POST') {
      const { cardNumber, direction, date: requestedDate } = body as {
        cardNumber: string;
        direction: 'ENTRY' | 'EXIT';
        date?: string;
      };
      const number = cardNumber?.trim();
      if (!number || (direction !== 'ENTRY' && direction !== 'EXIT')) {
        return studentError(400, 'কার্ড নম্বর ও প্রবেশ বা প্রস্থান দিন। / Provide a card number and entry or exit.');
      }
      const card = db.rfidCards.find((item) => sameName(item.cardNumber, number));
      const activeCard = card?.status === CardStatus.ACTIVE ? card : undefined;
      const student = activeCard ? db.students.find((item) => item.id === activeCard.studentId && item.status === StudentStatus.ACTIVE) : undefined;
      const year = db.academicYears.find((item) => item.isActive);
      const enrollment = student
        ? db.enrollments.find(
            (item) => item.studentId === student.id && item.academicYearId === year?.id && item.status === EnrollmentStatus.ACTIVE
          )
        : undefined;
      const schoolClass = enrollment ? db.classes.find((item) => item.id === enrollment.classId) : undefined;
      const section = enrollment ? db.sections.find((item) => item.id === enrollment.sectionId) : undefined;
      const scan = {
        id: uid('scan'),
        cardNumber: number,
        studentId: student?.id ?? null,
        studentName: student?.nameBn ?? student?.nameEn ?? null,
        className: schoolClass && section ? `${schoolClass.nameBn ?? schoolClass.name} (${section.name})` : null,
        scannedAt: nowIso(),
        deviceLocation: 'Main Gate Reader #1',
        direction,
        isKnownCard: Boolean(activeCard && student && enrollment),
      };
      db.rfidScans.unshift(scan);
      if (!card) return { data: clone({ ...scan, recorded: false, message: 'অপরিচিত কার্ড। / Unknown card.' }) };
      if (card.status !== CardStatus.ACTIVE) {
        return { data: clone({ ...scan, recorded: false, message: 'এই কার্ড সক্রিয় নয়। / This card is not active.' }) };
      }
      if (!student || !enrollment || !year) {
        return { data: clone({ ...scan, recorded: false, message: 'এই কার্ডের চলতি ভর্তি নেই। / This card has no active enrollment.' }) };
      }
      const config = db.classAttendanceConfigs.find((item) => item.classId === enrollment.classId);
      if ((config?.method ?? AttendanceMethod.MANUAL) !== AttendanceMethod.RFID) {
        return { data: clone({ ...scan, recorded: false, message: 'এই শ্রেণির হাজিরা হাতে নেওয়া হয়। / This class is marked by hand.' }) };
      }
      const targetDate = requestedDate?.trim() || localTodayIso();
      const closed = attendanceDayError(targetDate, year.id);
      if (closed) return { data: clone({ ...scan, recorded: false, message: closed }) };
      const existing = db.attendances.find((item) => item.studentEnrollmentId === enrollment.id && item.date === targetDate);
      const now = new Date();
      const [hour, minute] = (config?.lateThresholdTime || '10:15').split(':').map(Number);
      const late = now.getHours() > hour || (now.getHours() === hour && now.getMinutes() > minute);
      if (direction === 'EXIT') {
        if (existing) {
          existing.outTime = nowIso();
          existing.updatedAt = nowIso();
        }
        if (config?.autoSmsOnExit && existing) queueAttendanceSms(existing.id, student.id, enrollment.classId, targetDate, 'EXIT');
        return { data: clone({ ...scan, recorded: Boolean(existing), message: existing ? 'প্রস্থান নথিভুক্ত হয়েছে। / Exit recorded.' : 'প্রবেশের তথ্য পাওয়া যায়নি, শুধু স্ক্যান লগ হয়েছে। / No prior entry found; scan logged.' }) };
      }
      const status = late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
      const attId = existing?.id ?? uid('att');
      if (existing) {
        existing.status = existing.status === AttendanceStatus.LEAVE ? existing.status : status;
        existing.inTime = existing.inTime || nowIso();
        existing.method = AttendanceMethod.RFID;
        existing.updatedAt = nowIso();
      } else {
        db.attendances.push({
          id: attId,
          studentEnrollmentId: enrollment.id,
          date: targetDate,
          inTime: nowIso(),
          outTime: null,
          status,
          method: AttendanceMethod.RFID,
          markedBy: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }
      if (config?.autoSmsOnEntry) queueAttendanceSms(attId, student.id, enrollment.classId, targetDate, 'ENTRY');
      return { data: clone({ ...scan, recorded: true, message: late ? 'দেরিতে প্রবেশ নথিভুক্ত হয়েছে। / Late entry recorded.' : 'প্রবেশ নথিভুক্ত হয়েছে। / Entry recorded.' }) };
    }


  return null;
}
