import { db, getDbSnapshot, clone, uid, nowIso, addAudit } from '../state';
import { ResultPublicationStatus } from '@/src/types/enums';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import type { MockHandlerResult } from './types';
import { studentError } from './helpers';

export function handlePublicMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
    if (endpoint === '/bootstrap' && method === 'GET') {
      return { data: clone(db) };
    }

    // 2. Public Result Lookup (strictly PUBLISHED only; polite message for WITHHELD; never exposes private PII)
    if (endpoint === '/public/results/search' && method === 'POST') {
      const { examId, classId, roll, studentIdOrReg } = body as {
        examId: string;
        classId: string;
        roll?: string;
        studentIdOrReg?: string;
      };
      const exam = db.exams.find((e) => e.id === examId && !e.isDeleted);
      if (!exam) return { error: { status: 404, message: 'পরীক্ষাটি পাওয়া যায়নি / Exam not found.' } };

      if (exam.resultStatus === ResultPublicationStatus.WITHHELD) {
        return {
          data: {
            status: 'WITHHELD',
            messageBn: 'এই পরীক্ষার ফলাফল বর্তমানে কর্তৃপক্ষ কর্তৃক স্থগিত (Withheld) রাখা হয়েছে। অনুগ্রহ করে বিদ্যালয় অফিসে যোগাযোগ করুন।',
            messageEn: 'Results for this examination are currently withheld by the school authority. Please contact the school office.',
          },
        };
      }

      if (exam.resultStatus !== ResultPublicationStatus.PUBLISHED) {
        return {
          data: {
            status: 'NOT_PUBLISHED',
            messageBn: 'এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি।',
            messageEn: 'Results for this examination have not been published yet.',
          },
        };
      }

      const matchingEnr = db.enrollments.find((enr) => {
        if (enr.classId !== classId || enr.academicYearId !== exam.academicYearId) return false;
        const stu = db.students.find((s) => s.id === enr.studentId);
        if (!stu) return false;
        if (roll && String(enr.roll) === String(roll).trim()) return true;
        if (
          studentIdOrReg &&
          (stu.studentId.toLowerCase() === studentIdOrReg.trim().toLowerCase() ||
            stu.boardRegistrationNo === studentIdOrReg.trim())
        ) {
          return true;
        }
        return false;
      });

      if (!matchingEnr) {
        return {
          data: {
            status: 'NOT_FOUND',
            messageBn: 'প্রদত্ত রোল বা আইডি নম্বরে কোনো শিক্ষার্থীর প্রকাশিত ফলাফল পাওয়া যায়নি।',
            messageEn: 'No published result matched the provided roll number or student ID.',
          },
        };
      }

      const summary = db.resultSummaries.find(
        (rs) => rs.examId === exam.id && rs.studentEnrollmentId === matchingEnr.id
      );
      if (!summary) {
        return {
          data: {
            status: 'NOT_FOUND',
            messageBn: 'এই শিক্ষার্থীর ফলাফল এখনো প্রক্রিয়াকরণ করা হয়নি।',
            messageEn: 'Result summary is not available for this student yet.',
          },
        };
      }

      const stu = db.students.find((s) => s.id === matchingEnr.studentId)!;
      const cls = db.classes.find((c) => c.id === matchingEnr.classId)!;
      const sec = db.sections.find((s) => s.id === matchingEnr.sectionId)!;
      const grp = db.academicGroups.find((g) => g.id === matchingEnr.groupId) ?? null;
      const year = db.academicYears.find((y) => y.id === matchingEnr.academicYearId)!;

      const subjectRows = db.studentSubjectResults
        .filter((ssr) => ssr.examId === exam.id && ssr.studentEnrollmentId === matchingEnr.id)
        .map((ssr) => {
          const es = db.examSubjects.find((x) => x.id === ssr.examSubjectId)!;
          const sub = db.subjects.find((x) => x.id === es.subjectId)!;
          const mk = db.marks.find(
            (m) => m.examSubjectId === es.id && m.studentEnrollmentId === matchingEnr.id
          );
          return {
            subjectCode: sub.officialCode ?? '',
            subjectName: sub.name,
            subjectNameBn: sub.nameBn ?? sub.name,
            fullMarks: es.fullMarks,
            writtenMarks: mk?.writtenMarks ?? 0,
            mcqMarks: mk?.mcqMarks ?? 0,
            practicalMarks: mk?.practicalMarks ?? 0,
            totalMarks: ssr.totalMarks,
            letterGrade: ssr.letterGrade,
            gradePoint: ssr.gradePoint,
            isPassed: ssr.isPassed,
            isOptional: ssr.isOptional,
            bonusGradePoint: ssr.bonusGradePoint ?? 0,
            isAbsent: ssr.isAbsent,
          };
        });

      // Return ONLY public-safe student metadata (no address, NID, birth cert, or parent phone!)
      return {
        data: {
          status: 'FOUND',
          resultId: summary.id,
          exam: { id: exam.id, name: exam.name, examType: exam.examType, publishedAt: exam.publishedAt },
          student: {
            studentId: stu.studentId,
            nameEn: stu.nameEn,
            nameBn: stu.nameBn,
            roll: matchingEnr.roll,
            className: cls.name,
            classNameBn: cls.nameBn ?? cls.name,
            sectionName: sec.name,
            groupName: grp?.name ?? null,
            groupNameBn: grp?.nameBn ?? null,
            academicYear: year.name,
          },
          summary: clone(summary),
          subjects: subjectRows,
        },
      };
    }

    // 3. Submit Online Admission Application (Unified Class 6-10 real-world validation)
    if (endpoint === '/public/admissions' && method === 'POST') {
      const payload = body as Omit<
        OnlineAdmissionApplication,
        'id' | 'applicationNumber' | 'status' | 'submittedAt' | 'admissionTestRoll' | 'admissionTestDate'
      >;
      const bcn = String(payload.birthCertificateNo ?? '').trim();
      if (bcn) {
        const dupStudent = db.students.find((s) => s.birthCertificateNo === bcn);
        if (dupStudent) {
          return studentError(
            409,
            `এই জন্ম নিবন্ধন নম্বর ইতোমধ্যে ভর্তি শিক্ষার্থী (${dupStudent.studentId})-এর নামে নিবন্ধিত। / Birth certificate already registered.`
          );
        }
        const dupApp = db.onlineAdmissions.find(
          (a) => a.birthCertificateNo === bcn && a.status !== 'REJECTED'
        );
        if (dupApp) {
          return studentError(
            409,
            `এই জন্ম নিবন্ধন নম্বর দিয়ে ইতোমধ্যে আবেদন (${dupApp.applicationNumber}) জমা আছে। / Active application already exists for this Birth Certificate.`
          );
        }
      }
      const brn = payload.boardRegistrationNo ? String(payload.boardRegistrationNo).trim() : '';
      if (brn) {
        const dupRegStu = db.students.find((s) => s.boardRegistrationNo === brn);
        const dupRegApp = db.onlineAdmissions.find(
          (a) => a.boardRegistrationNo === brn && a.status !== 'REJECTED'
        );
        if (dupRegStu || dupRegApp) {
          return studentError(
            409,
            'এই বোর্ড রেজিস্ট্রেশন নম্বরটি ইতোমধ্যে সিস্টেমে নিবন্ধিত রয়েছে। / Board registration number is already in use.'
          );
        }
      }
      const seq = String(db.onlineAdmissions.length + 1).padStart(3, '0');
      const created: OnlineAdmissionApplication = {
        ...payload,
        id: uid('app'),
        applicationNumber: `ADM-2027-${seq}`,
        status: 'NEW',
        submittedAt: nowIso(),
        admissionTestRoll: `270${seq}`,
        admissionTestDate: db.admissionContent.admissionTestDate ?? '2026-12-24',
      };
      db.onlineAdmissions.unshift(created);
      db.notifications.unshift({
        id: uid('ntf'),
        type: 'ADMISSION',
        titleBn: `নতুন ভর্তি আবেদন: ${created.applicationNumber}`,
        titleEn: `New Admission Application: ${created.applicationNumber}`,
        bodyBn: `${created.studentNameBn} অনলাইন ভর্তি আবেদন জমা দিয়েছেন।`,
        bodyEn: `${created.studentNameEn} submitted an online admission application.`,
        createdAt: nowIso(),
        isRead: false,
        targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
        link: '/admin/students/admissions',
      });
      return { data: clone(created) };
    }


  return null;
}
