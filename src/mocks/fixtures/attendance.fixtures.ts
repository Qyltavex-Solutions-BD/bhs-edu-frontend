import {
  AttendanceMethod,
  AttendanceSmsType,
  AttendanceStatus,
  SmsStatus,
} from '@/src/types/enums';
import type {
  Attendance,
  AttendancePublicSummary,
  AttendanceSmsLog,
  Parent,
  ParentStudent,
  SchoolClass,
  Student,
  StudentEnrollment,
} from '@/src/types/entities';
import type {
  ClassAttendanceMethodConfig,
  RfidScanEvent,
} from '@/src/types/proposed/future';
import { NOW } from './common';

export function createAttendanceFixtures(params: {
  classes: SchoolClass[];
  enrollments: StudentEnrollment[];
  students: Student[];
  parents: Parent[];
  parentStudents: ParentStudent[];
}) {
  const { classes, enrollments, students, parents, parentStudents } = params;
  // 7. Attendance (14 recent school days) + SMS Logs + Configurable Class Attendance Methods
  const classAttendanceConfigs: ClassAttendanceMethodConfig[] = classes.map((c) => ({
    classId: c.id,
    method: c.numericValue === 10 ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
    autoSmsOnEntry: c.numericValue === 10,
    autoSmsOnExit: c.numericValue === 10,
    autoSmsOnAbsent: true,
    lateThresholdTime: '10:15',
  }));

  const attendances: Attendance[] = [];
  const attendanceSmsLogs: AttendanceSmsLog[] = [];
  const schoolDates = [
    '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05',
    '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12',
    '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19',
  ];

  schoolDates.forEach((dateStr, dIdx) => {
    enrollments.forEach((enr, eIdx) => {
      const isClass10 = enr.classId === 'cls-10';
      const mod = (dIdx * 7 + eIdx * 3) % 19;
      let status = AttendanceStatus.PRESENT;
      if (mod === 0) status = AttendanceStatus.ABSENT;
      else if (mod === 1) status = AttendanceStatus.LATE;
      else if (mod === 2 && eIdx % 4 === 0) status = AttendanceStatus.LEAVE;

      const attId = `att-${dateStr}-${enr.id}`;
      attendances.push({
        id: attId,
        studentEnrollmentId: enr.id,
        date: dateStr,
        inTime: status === AttendanceStatus.PRESENT ? `${dateStr}T09:52:00` : status === AttendanceStatus.LATE ? `${dateStr}T10:24:00` : null,
        outTime: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE ? `${dateStr}T15:30:00` : null,
        status,
        method: isClass10 ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
        markedBy: isClass10 ? null : 'user-teacher-1',
        createdAt: `${dateStr}T10:30:00.000Z`,
        updatedAt: `${dateStr}T10:30:00.000Z`,
      });

      if (dIdx >= schoolDates.length - 3) {
        const ps = parentStudents.find((x) => x.studentId === enr.studentId && x.isSmsReceiver);
        const parent = ps ? parents.find((p) => p.id === ps.parentId) : null;
        const student = students.find((s) => s.id === enr.studentId);
        if (parent && student && (status === AttendanceStatus.ABSENT || (isClass10 && status === AttendanceStatus.PRESENT))) {
          const smsType = status === AttendanceStatus.ABSENT ? AttendanceSmsType.ABSENT : AttendanceSmsType.ENTRY;
          const smsStatus = (dIdx + eIdx) % 7 === 0 ? SmsStatus.FAILED : SmsStatus.SENT;
          attendanceSmsLogs.push({
            id: `sms-${attId}`,
            attendanceId: attId,
            parentId: parent.id,
            smsType,
            phone: parent.phone,
            message:
              smsType === AttendanceSmsType.ABSENT
                ? `প্রিয় অভিভাবক, আপনার সন্তান ${student.nameBn} আজ (${dateStr}) বিদ্যালয়ে অনুপস্থিত। - ভোজেশ্বর উচ্চ বিদ্যালয়`
                : `প্রিয় অভিভাবক, আপনার সন্তান ${student.nameBn} সকাল ০৯:৫২ মিনিটে RFID কার্ডের মাধ্যমে বিদ্যালয়ে প্রবেশ করেছে।`,
            status: smsStatus,
            sentAt: smsStatus === SmsStatus.SENT ? `${dateStr}T10:35:00.000Z` : null,
            createdAt: `${dateStr}T10:34:00.000Z`,
          });
        }
      }
    });
  });

  const rfidScans: RfidScanEvent[] = [
    { id: 'scan-1', cardNumber: 'RFID-10-8841', studentId: 'stu-10-1', studentName: 'তানভীর আহমেদ', className: '১০ম শ্রেণি (ক)', scannedAt: '2026-11-19T09:48:12.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: true },
    { id: 'scan-2', cardNumber: 'RFID-10-8842', studentId: 'stu-10-2', studentName: 'নুসরাত জাহান মিম', className: '১০ম শ্রেণি (ক)', scannedAt: '2026-11-19T09:50:44.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: true },
    { id: 'scan-3', cardNumber: 'RFID-10-8843', studentId: 'stu-10-3', studentName: 'প্রান্ত চন্দ্র দাস', className: '১০ম শ্রেণি (ক)', scannedAt: '2026-11-19T09:53:09.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: true },
    { id: 'scan-4', cardNumber: 'RFID-UNK-9902', studentId: null, studentName: null, className: null, scannedAt: '2026-11-19T09:55:21.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: false },
  ];

  const attendancePublicSummaries: AttendancePublicSummary[] = [
    { id: 'aps-1', summaryDate: '2026-11-19', title: 'দৈনিক শ্রেণি উপস্থিতি সারসংক্ষেপ', description: 'ষষ্ঠ থেকে দশম শ্রেণির সমন্বিত উপস্থিতির হার', presentCount: 18, absentCount: 2, isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];


  return {
    attendances,
    attendanceSmsLogs,
    attendancePublicSummaries,
    classAttendanceConfigs,
    rfidScans,
  };
}
