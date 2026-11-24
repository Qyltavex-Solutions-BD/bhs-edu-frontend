import { db, clone, uid, nowIso, addAudit, sameName } from '../state';
import { studentError, placementError, identityError, linkGuardian } from './helpers';
import {
  BloodGroup,
  CardStatus,
  EnrollmentStatus,
  Gender,
  PromotionType,
  RelationshipType,
  Religion,
  StudentStatus,
  TestimonialType,
} from '@/src/types/enums';
import type {
  Student,
  StudentEnrollment,
  StudentPromotion,
  StudentRFIDcard,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';
import type { MockHandlerResult } from './types';

export function handleStudentsMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {

    if (endpoint === '/students' && method === 'POST') {
      const p = body as Record<string, unknown>;
      const nameEn = String(p.nameEn ?? '').trim();
      const nameBn = String(p.nameBn ?? '').trim();
      const fatherName = String(p.fatherNameEn ?? p.parentName ?? '').trim();
      const fatherNameBn = String(p.fatherNameBn ?? p.parentNameBn ?? '').trim();
      const motherName = String(p.motherNameEn ?? '').trim();
      const motherNameBn = String(p.motherNameBn ?? '').trim();
      const guardianPhone = String(p.guardianPhone ?? p.parentPhone ?? '').trim();
      const fatherAlive = p.fatherAlive !== false;
      const motherAlive = p.motherAlive !== false;
      if (!nameEn || !nameBn) return studentError(400, 'শিক্ষার্থীর বাংলা ও ইংরেজি নাম আবশ্যক। / Both names are required.');
      if (!fatherName || !fatherNameBn || !guardianPhone) {
        return studentError(400, 'পিতার নাম ও অভিভাবকের মোবাইল আবশ্যক। / Father’s name and an active guardian phone are required.');
      }
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(guardianPhone)) {
        return studentError(400, 'অভিভাবকের মোবাইল সঠিক নয়। / Guardian phone is not a valid Bangladesh number.');
      }
      const fatherPhoneRaw = String(p.fatherPhone ?? '').trim();
      if (fatherPhoneRaw && !/^(\+?88)?01[3-9]\d{8}$/.test(fatherPhoneRaw)) {
        return studentError(400, 'পিতার মোবাইল সঠিক নয়। / Father’s phone is not a valid Bangladesh number.');
      }
      const motherPhoneRaw = String(p.motherPhone ?? '').trim();
      if (motherPhoneRaw && !/^(\+?88)?01[3-9]\d{8}$/.test(motherPhoneRaw)) {
        return studentError(400, 'মাতার মোবাইল সঠিক নয়। / Mother’s phone is not a valid Bangladesh number.');
      }
      if (!motherName || !motherNameBn) {
        return studentError(400, 'মাতার বাংলা ও ইংরেজি নাম আবশ্যক। / Mother’s name is required.');
      }
      const birth = p.birthCertificateNo ? String(p.birthCertificateNo).trim() : '';
      if (birth && !/^\d{17}$/.test(birth)) {
        return studentError(400, 'জন্ম সনদ ১৭ ডিজিটের হতে হবে। / Birth certificate must be 17 digits.');
      }
      const groupId = p.groupId ? String(p.groupId) : null;
      const placed = placementError({
        academicYearId: String(p.academicYearId ?? ''),
        classId: String(p.classId ?? ''),
        sectionId: String(p.sectionId ?? ''),
        groupId,
        roll: Number(p.roll),
      });
      if (placed) return studentError(400, placed);
      const identity = identityError({
        birthCertificateNo: p.birthCertificateNo ? String(p.birthCertificateNo) : null,
        boardRegistrationNo: p.boardRegistrationNo ? String(p.boardRegistrationNo) : null,
      });
      if (identity) return studentError(409, identity);
      const optionalId = p.optionalClassSubjectId ? String(p.optionalClassSubjectId) : null;
      if (optionalId) {
        const optional = db.classSubjects.find(
          (row) => row.id === optionalId && row.isOptional && row.isActive && row.classId === String(p.classId)
        );
        if (!optional) {
          return studentError(400, 'ঐচ্ছিক বিষয় এই শ্রেণির পাঠ্যতালিকায় নেই। / That optional subject is not on this class curriculum.');
        }
      }
      const stuId = uid('stu');
      const newStudent: Student = {
        id: stuId,
        studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
        birthCertificateNo: birth || null,
        boardRegistrationNo: p.boardRegistrationNo ? String(p.boardRegistrationNo).trim() : null,
        nameEn,
        nameBn,
        photo: p.photo ? String(p.photo) : null,
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth) : null,
        gender: p.gender as Student['gender'],
        bloodGroup: (p.bloodGroup as Student['bloodGroup']) || null,
        religion: (p.religion as Student['religion']) || null,
        nationality: p.nationality ? String(p.nationality) : 'বাংলাদেশি',
        studentPhone: p.studentPhone ? String(p.studentPhone) : null,
        presentAddress: p.presentAddress ? String(p.presentAddress) : null,
        permanentAddress: p.permanentAddress ? String(p.permanentAddress) : null,
        admissionDate: String(p.admissionDate ?? nowIso().slice(0, 10)),
        admissionType: (p.admissionType as Student['admissionType']) || (p.isReadmission ? 'READMISSION' : 'NEW'),
        status: StudentStatus.ACTIVE,
        previousSchoolName: p.previousSchoolName ? String(p.previousSchoolName) : null,
        previousSchoolEiin: p.previousSchoolEiin ? String(p.previousSchoolEiin) : null,
        previousSchoolAddress: p.previousSchoolAddress ? String(p.previousSchoolAddress) : null,
        previousGrade: p.previousGrade ? String(p.previousGrade) : null,
        previousGpa: p.previousGpa ? Number(p.previousGpa) : null,
        prevExamPassingYear: p.prevExamPassingYear ? Number(p.prevExamPassingYear) : null,
        prevExamRoll: p.prevExamRoll ? String(p.prevExamRoll) : null,
        prevExamRegistration: p.prevExamRegistration ? String(p.prevExamRegistration) : null,
        prevExamGpa: p.prevExamGpa ? Number(p.prevExamGpa) : null,
        transferCertificateNo: p.transferCertificateNo ? String(p.transferCertificateNo) : null,
        transferCertificateDate: p.transferCertificateDate ? String(p.transferCertificateDate) : null,
        verifiedDocuments: (p.verifiedDocuments as Record<string, boolean>) || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.students.unshift(newStudent);
      const newEnr: StudentEnrollment = {
        id: uid('enr'),
        studentId: stuId,
        academicYearId: String(p.academicYearId),
        classId: String(p.classId),
        sectionId: String(p.sectionId),
        groupId,
        optionalClassSubjectId: optionalId,
        roll: Number(p.roll),
        enrollmentDate: nowIso().slice(0, 10),
        formSerialNo: p.formSerialNo ? String(p.formSerialNo) : null,
        isRepeater: false,
        isReadmission: Boolean(p.isReadmission) || p.admissionType === 'READMISSION',
        status: EnrollmentStatus.ACTIVE,
        remarks: p.remarks ? String(p.remarks) : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.enrollments.unshift(newEnr);

      const bothDeceased = !fatherAlive && !motherAlive;
      const fatherPrimaryPhone = fatherAlive
        ? fatherPhoneRaw || guardianPhone
        : `deceased-f-${String(p.fatherNid ?? uid('f')).replace(/\s/g, '')}`;

      const directPrimaryRole =
        (p.primaryGuardianType as 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | undefined) ??
        (bothDeceased ? 'LEGAL_GUARDIAN' : fatherAlive ? 'FATHER' : 'MOTHER');
      linkGuardian(stuId, {
        name: fatherName,
        nameBn: fatherNameBn,
        phone: fatherPrimaryPhone,
        occupation: fatherAlive
          ? p.fatherOccupation
            ? String(p.fatherOccupation)
            : p.parentOccupation
              ? String(p.parentOccupation)
              : null
          : 'মৃত',
        nid: p.fatherNid ? String(p.fatherNid) : p.parentNid ? String(p.parentNid) : null,
        address: p.presentAddress ? String(p.presentAddress) : null,
        relationship: RelationshipType.FATHER,
        sms: directPrimaryRole === 'FATHER' && fatherAlive,
      });

      const motherPhone =
        motherAlive && motherPhoneRaw && motherPhoneRaw !== fatherPrimaryPhone
          ? motherPhoneRaw
          : `unused-${String(p.motherNid ?? uid('m')).replace(/\s/g, '')}`;

      linkGuardian(stuId, {
        name: motherName,
        nameBn: motherNameBn,
        phone: motherPhone,
        occupation: motherAlive ? (p.motherOccupation ? String(p.motherOccupation) : null) : 'মৃত',
        nid: p.motherNid ? String(p.motherNid) : null,
        address: p.presentAddress ? String(p.presentAddress) : null,
        relationship: RelationshipType.MOTHER,
        sms: directPrimaryRole === 'MOTHER' && motherAlive,
      });

      const legalNameBn = p.legalGuardianNameBn ? String(p.legalGuardianNameBn).trim() : '';
      const legalPhone = p.legalGuardianPhone ? String(p.legalGuardianPhone).trim() : '';
      if (legalNameBn && legalPhone) {
        linkGuardian(stuId, {
          name: p.legalGuardianNameEn ? String(p.legalGuardianNameEn).trim() : legalNameBn,
          nameBn: legalNameBn,
          phone: legalPhone,
          occupation: p.legalGuardianRelation ? String(p.legalGuardianRelation).trim() : 'বৈধ অভিভাবক',
          nid: p.legalGuardianNid ? String(p.legalGuardianNid).trim() : null,
          address: p.legalGuardianAddress ? String(p.legalGuardianAddress).trim() : p.presentAddress ? String(p.presentAddress) : null,
          relationship: RelationshipType.GUARDIAN,
          sms: directPrimaryRole === 'LEGAL_GUARDIAN' || bothDeceased,
        });
      }

      if (p.sourceApplicationId) {
        const sourceApp = db.onlineAdmissions.find((a) => a.id === String(p.sourceApplicationId));
        if (sourceApp) {
          sourceApp.status = 'ADMITTED';
          sourceApp.verifiedDocuments = (p.verifiedDocuments as Record<string, boolean>) || sourceApp.verifiedDocuments;
        }
      }

      addAudit('STUDENT_CREATE', 'Students', `Registered ${newStudent.nameEn} (${newStudent.studentId}).`);
      return { data: clone({ student: newStudent, enrollment: newEnr }) };
    }

    if (endpoint === '/students/update' && method === 'POST') {
      const p = body as Partial<Student> & { id: string };
      const student = db.students.find((item) => item.id === p.id);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      const nameEn = (p.nameEn ?? student.nameEn).trim();
      if (!nameEn) return studentError(400, 'ইংরেজি নাম আবশ্যক। / English name is required.');
      const identity = identityError({
        birthCertificateNo: p.birthCertificateNo,
        boardRegistrationNo: p.boardRegistrationNo,
        ignoreStudentId: student.id,
      });
      if (identity) return studentError(409, identity);
      student.nameEn = nameEn;
      student.nameBn = p.nameBn?.trim() || null;
      student.dateOfBirth = p.dateOfBirth || null;
      if (p.gender) student.gender = p.gender;
      student.bloodGroup = p.bloodGroup || null;
      student.religion = p.religion || null;
      student.presentAddress = p.presentAddress?.trim() || null;
      student.permanentAddress = p.permanentAddress?.trim() || null;
      student.birthCertificateNo = p.birthCertificateNo?.trim() || null;
      student.boardRegistrationNo = p.boardRegistrationNo?.trim() || null;
      student.previousSchoolName = p.previousSchoolName?.trim() || null;
      student.previousGpa = p.previousGpa ?? null;
      if (p.status === StudentStatus.ACTIVE || p.status === StudentStatus.INACTIVE) student.status = p.status;
      student.updatedAt = nowIso();
      addAudit('STUDENT_UPDATE', 'Students', `Updated ${student.studentId}.`);
      return { data: clone(student) };
    }

    if (endpoint === '/students/enrollments' && method === 'POST') {
      const p = body as Partial<StudentEnrollment> & { id: string };
      const enrollment = db.enrollments.find((item) => item.id === p.id);
      if (!enrollment) return studentError(404, 'ভর্তি রেকর্ড পাওয়া যায়নি। / Enrollment was not found.');
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        return studentError(400, 'শুধুমাত্র সক্রিয় এনরোলমেন্ট সম্পাদনা করা যাবে। / Only active enrollments can be edited.');
      }
      const groupId = p.groupId ? String(p.groupId) : null;
      const placed = placementError({
        academicYearId: enrollment.academicYearId,
        classId: enrollment.classId,
        sectionId: String(p.sectionId ?? enrollment.sectionId),
        groupId,
        roll: Number(p.roll ?? enrollment.roll),
        studentId: enrollment.studentId,
        ignoreEnrollmentId: enrollment.id,
      });
      if (placed) return studentError(400, placed);
      const optionalId = p.optionalClassSubjectId ? String(p.optionalClassSubjectId) : null;
      if (optionalId) {
        const optional = db.classSubjects.find((row) => row.id === optionalId && row.isOptional && row.isActive);
        if (
          !optional ||
          optional.academicYearId !== enrollment.academicYearId ||
          optional.classId !== enrollment.classId ||
          (optional.groupId && optional.groupId !== groupId)
        ) {
          return studentError(400, 'ঐচ্ছিক বিষয় এই শ্রেণি ও বিভাগের নয়। / That optional subject does not match this class and stream.');
        }
      }
      enrollment.sectionId = String(p.sectionId ?? enrollment.sectionId);
      enrollment.groupId = groupId;
      enrollment.roll = Number(p.roll ?? enrollment.roll);
      enrollment.optionalClassSubjectId = optionalId;
      enrollment.isRepeater = Boolean(p.isRepeater);
      enrollment.isReadmission = Boolean(p.isReadmission);
      enrollment.remarks = p.remarks?.trim() || null;
      enrollment.updatedAt = nowIso();
      addAudit('ENROLLMENT_UPDATE', 'Students', `Updated enrollment ${enrollment.id}.`);
      return { data: clone(enrollment) };
    }

    if (endpoint === '/students/import' && method === 'POST') {
      const { academicYearId, rows } = body as {
        academicYearId: string;
        rows: Array<Record<string, string>>;
      };
      const created: string[] = [];
      const errors: { row: number; message: string }[] = [];
      rows.forEach((row, index) => {
        const schoolClass = db.classes.find(
          (item) => sameName(item.name, row.className || '') || sameName(item.nameBn || '', row.className || '')
        );
        const section = schoolClass
          ? db.sections.find((item) => item.classId === schoolClass.id && sameName(item.name, row.sectionName || ''))
          : undefined;
        const group = row.groupName
          ? db.academicGroups.find((item) => sameName(item.name, row.groupName) || sameName(item.nameBn || '', row.groupName))
          : undefined;
        const snapshot = {
          students: db.students.length,
          enrollments: db.enrollments.length,
          parents: db.parents.length,
          links: db.parentStudents.length,
        };
        const result = (() => {
          const nameEn = (row.nameEn || '').trim();
          const parentName = (row.parentName || '').trim();
          const parentPhone = (row.parentPhone || '').trim();
          if (!nameEn || !parentName || !parentPhone || !schoolClass || !section) {
            return 'নাম, অভিভাবক, শ্রেণি ও শাখা মিলছে না। / Name, guardian, class, or section did not match.';
          }
          const placed = placementError({
            academicYearId,
            classId: schoolClass.id,
            sectionId: section.id,
            groupId: group?.id ?? null,
            roll: Number(row.roll),
          });
          if (placed) return placed;
          const identity = identityError({ birthCertificateNo: row.birthCertificateNo });
          if (identity) return identity;
          const stuId = uid('stu');
          db.students.unshift({
            id: stuId,
            studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
            birthCertificateNo: row.birthCertificateNo?.trim() || null,
            nameEn,
            nameBn: row.nameBn?.trim() || null,
            dateOfBirth: row.dateOfBirth || null,
            gender: (row.gender as Student['gender']) || ('MALE' as Student['gender']),
            admissionDate: nowIso().slice(0, 10),
            status: StudentStatus.ACTIVE,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
          db.enrollments.unshift({
            id: uid('enr'),
            studentId: stuId,
            academicYearId,
            classId: schoolClass.id,
            sectionId: section.id,
            groupId: group?.id ?? null,
            roll: Number(row.roll),
            enrollmentDate: nowIso().slice(0, 10),
            isRepeater: false,
            isReadmission: false,
            status: EnrollmentStatus.ACTIVE,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
          linkGuardian(stuId, { name: parentName, phone: parentPhone, relationship: RelationshipType.GUARDIAN });
          created.push(stuId);
          return null;
        })();
        if (result) {
          db.students.splice(0, db.students.length - snapshot.students);
          db.enrollments.splice(0, db.enrollments.length - snapshot.enrollments);
          db.parents.splice(0, db.parents.length - snapshot.parents);
          db.parentStudents.splice(0, db.parentStudents.length - snapshot.links);
          errors.push({ row: index + 1, message: result });
        }
      });
      addAudit('STUDENT_IMPORT', 'Students', `Imported ${created.length} students, ${errors.length} rows skipped.`);
      return { data: { created: created.length, errors } };
    }

    if (endpoint === '/students/tc' && method === 'POST') {
      const payload = body as Omit<StudentTransferCertificate, 'id' | 'createdAt' | 'updatedAt'>;
      const student = db.students.find((item) => item.id === payload.studentId);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      if (student.status !== StudentStatus.ACTIVE) {
        return studentError(409, 'শুধু সক্রিয় শিক্ষার্থীর ছাড়পত্র ইস্যু হয়। / A transfer certificate can only be issued for an active student.');
      }
      const tcNumber = payload.tcNumber?.trim();
      if (!tcNumber || !payload.reason?.trim() || !payload.issueDate || !payload.leavingDate) {
        return studentError(400, 'টিসি নম্বর, তারিখ ও কারণ আবশ্যক। / TC number, dates, and reason are required.');
      }
      if (db.transferCertificates.some((item) => sameName(item.tcNumber, tcNumber))) {
        return studentError(409, 'এই টিসি নম্বর আগে ব্যবহার হয়েছে। / This TC number is already used.');
      }
      const enrollment = db.enrollments.find(
        (item) => item.studentId === student.id && item.status === EnrollmentStatus.ACTIVE
      );
      const enrolledClass = enrollment
        ? db.classes.find((cls) => cls.id === enrollment.classId)
        : null;
      const derivedLeavingClass =
        payload.leavingClass?.trim() ||
        enrolledClass?.nameBn ||
        enrolledClass?.name ||
        null;

      const tc: StudentTransferCertificate = {
        ...payload,
        tcNumber,
        reason: payload.reason.trim(),
        conductRemarks: payload.conductRemarks?.trim() || null,
        destinationSchool: payload.destinationSchool?.trim() || null,
        remarks: payload.remarks?.trim() || null,
        leavingClass: derivedLeavingClass,
        promotedToNextClass: Boolean(payload.promotedToNextClass),
        enrollmentId: enrollment?.id ?? payload.enrollmentId ?? null,
        id: uid('tc'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.transferCertificates.unshift(tc);
      student.status = StudentStatus.TRANSFERRED;
      student.updatedAt = nowIso();
      if (enrollment) {
        enrollment.status = EnrollmentStatus.TRANSFERRED;
        enrollment.updatedAt = nowIso();
      }

      // Automatically block any active RFID cards belonging to the transferred student
      let autoBlockedCards = 0;
      db.rfidCards.forEach((card) => {
        if (card.studentId === student.id && card.status === CardStatus.ACTIVE) {
          card.status = CardStatus.BLOCKED;
          card.remarks = `ছাড়পত্র (${tcNumber}) ইস্যু হওয়ায় স্বয়ংক্রিয়ভাবে বন্ধ করা হয়েছে।`;
          card.updatedAt = nowIso();
          autoBlockedCards += 1;
          addAudit(
            'RFID_AUTO_BLOCK',
            'Students',
            `Auto-blocked RFID card ${card.cardNumber} upon TC ${tcNumber} issuance.`
          );
        }
      });

      addAudit(
        'TC_ISSUE',
        'Students',
        `Issued Transfer Certificate ${tc.tcNumber} for ${student.studentId}${autoBlockedCards ? ` (auto-blocked ${autoBlockedCards} RFID card)` : ''}.`
      );
      return { data: clone({ ...tc, autoBlockedCards }) };
    }

    // 14b. Issue Student Testimonial / Character Certificate
    if (endpoint === '/students/testimonials' && method === 'POST') {
      const payload = body as Omit<StudentTestimonial, 'id' | 'createdAt' | 'updatedAt'>;
      const student = db.students.find((item) => item.id === payload.studentId);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      const refNumber = payload.refNumber?.trim();
      if (!refNumber || !payload.issueDate) {
        return studentError(400, 'স্মারক নম্বর ও ইস্যুর তারিখ আবশ্যক। / Reference number and issue date are required.');
      }
      if (db.testimonials.some((item) => sameName(item.refNumber, refNumber))) {
        return studentError(409, 'এই স্মারক নম্বরটি আগেই ব্যবহৃত হয়েছে। / This reference number is already used.');
      }
      const type =
        payload.type === TestimonialType.SSC_GRADUATE
          ? TestimonialType.SSC_GRADUATE
          : TestimonialType.STUDY_CHARACTER;

      if (type === TestimonialType.SSC_GRADUATE && (!payload.passingYear?.trim() || !payload.boardRoll?.trim())) {
        return studentError(
          400,
          'এসএসসি প্রশংসাপত্রের জন্য পাসের সন ও বোর্ড রোল আবশ্যক। / Passing year and board roll are required for an SSC testimonial.'
        );
      }

      const enrollment =
        db.enrollments.find(
          (item) => item.studentId === student.id && item.status === EnrollmentStatus.ACTIVE
        ) ??
        db.enrollments
          .filter((item) => item.studentId === student.id)
          .sort((a, b) => b.enrollmentDate.localeCompare(a.enrollmentDate))[0];

      const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;
      const sec = enrollment ? db.sections.find((s) => s.id === enrollment.sectionId) : null;
      const grp = enrollment?.groupId
        ? db.academicGroups.find((g) => g.id === enrollment.groupId)
        : null;
      const activeYear = db.academicYears.find((y) => y.isActive) ?? db.academicYears[0];

      const testimonial: StudentTestimonial = {
        id: uid('test'),
        studentId: student.id,
        enrollmentId: enrollment?.id ?? payload.enrollmentId ?? null,
        refNumber,
        type,
        issueDate: payload.issueDate,
        academicSession: payload.academicSession?.trim() || activeYear?.name || '2026',
        className: payload.className?.trim() || cls?.nameBn || cls?.name || 'অধ্যয়নরত',
        sectionName: payload.sectionName?.trim() || sec?.name || null,
        roll: payload.roll ?? enrollment?.roll ?? null,
        groupName: payload.groupName?.trim() || grp?.nameBn || grp?.name || null,
        purpose: payload.purpose?.trim() || null,
        conductRemarks: payload.conductRemarks?.trim() || 'উত্তম ও শৃঙ্খলাপরায়ণ',
        boardName: payload.boardName?.trim() || null,
        passingYear: payload.passingYear?.trim() || null,
        boardRoll: payload.boardRoll?.trim() || null,
        registrationNo: payload.registrationNo?.trim() || student.boardRegistrationNo || null,
        gpa: payload.gpa?.trim() || null,
        letterGrade: payload.letterGrade?.trim() || null,
        remarks: payload.remarks?.trim() || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      db.testimonials.unshift(testimonial);
      addAudit(
        'TESTIMONIAL_ISSUE',
        'Students',
        `Issued ${type} testimonial ${testimonial.refNumber} for ${student.studentId}.`
      );
      return { data: clone(testimonial) };
    }

    // 15. Add / Update Class Routine Slot with Conflict Prevention
    if (endpoint === '/students/rfid' && method === 'POST') {
      const { studentId, cardNumber, remarks } = body as {
        studentId: string;
        cardNumber: string;
        remarks?: string | null;
      };
      const student = db.students.find((item) => item.id === studentId);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      if (student.status !== StudentStatus.ACTIVE) {
        return studentError(
          409,
          'শুধুমাত্র সক্রিয় শিক্ষার্থীকে নতুন কার্ড ইস্যু করা যায়। / RFID cards can only be issued to active students.'
        );
      }
      const number = cardNumber?.trim();
      if (!number) return studentError(400, 'কার্ড নম্বর আবশ্যক। / Card number is required.');
      if (db.rfidCards.some((card) => sameName(card.cardNumber, number))) {
        return studentError(409, 'এই কার্ড নম্বর আগে ইস্যু হয়েছে। / This card number is already issued.');
      }
      if (db.rfidCards.some((card) => card.studentId === studentId && card.status === CardStatus.ACTIVE)) {
        return studentError(409, 'এই শিক্ষার্থীর একটি সক্রিয় কার্ড আছে। আগে সেটি বন্ধ বা রিপ্লেস করুন। / This student already has an active card.');
      }
      const card = {
        id: uid('rfid'),
        studentId,
        cardNumber: number,
        status: CardStatus.ACTIVE,
        issuedAt: nowIso(),
        remarks: remarks?.trim() || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.rfidCards.unshift(card);
      addAudit('RFID_ISSUE', 'Students', `Issued card ${number} to ${student.studentId}.`);
      return { data: clone(card) };
    }

    if (endpoint === '/students/rfid/status' && method === 'POST') {
      const { id, status, remarks } = body as {
        id: string;
        status: CardStatus;
        remarks?: string | null;
      };
      const card = db.rfidCards.find((c) => c.id === id);
      if (!card) return studentError(404, 'কার্ড পাওয়া যায়নি। / Card was not found.');
      const student = db.students.find((item) => item.id === card.studentId);
      if (status === CardStatus.ACTIVE) {
        if (student && student.status !== StudentStatus.ACTIVE) {
          return studentError(
            409,
            'স্থানান্তরিত বা নিষ্ক্রিয় শিক্ষার্থীর কার্ড সক্রিয় করা যায় না। / Cannot activate a card for a non-active student.'
          );
        }
        if (
          db.rfidCards.some(
            (item) =>
              item.id !== card.id &&
              item.studentId === card.studentId &&
              item.status === CardStatus.ACTIVE
          )
        ) {
          return studentError(
            409,
            'এই শিক্ষার্থীর আরেকটি সক্রিয় কার্ড আছে। / This student already has another active card.'
          );
        }
      }
      card.status = status;
      if (remarks !== undefined) {
        card.remarks = remarks?.trim() || null;
      }
      card.updatedAt = nowIso();
      addAudit('RFID_STATUS', 'Students', `Updated RFID card ${card.cardNumber} status to ${status}.`);
      return { data: clone(card) };
    }

    if (endpoint === '/students/rfid/replace' && method === 'POST') {
      const { oldCardId, oldCardStatus, newCardNumber, remarks } = body as {
        oldCardId: string;
        oldCardStatus: CardStatus.LOST | CardStatus.DAMAGED | CardStatus.BLOCKED;
        newCardNumber: string;
        remarks?: string | null;
      };
      const oldCard = db.rfidCards.find((c) => c.id === oldCardId);
      if (!oldCard) return studentError(404, 'পূর্ববর্তী কার্ড পাওয়া যায়নি। / Previous card was not found.');
      const student = db.students.find((item) => item.id === oldCard.studentId);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      if (student.status !== StudentStatus.ACTIVE) {
        return studentError(
          409,
          'শুধুমাত্র সক্রিয় শিক্ষার্থীর কার্ড রিপ্লেস করা যায়। / Cards can only be replaced for active students.'
        );
      }
      const nextNum = newCardNumber?.trim();
      if (!nextNum) return studentError(400, 'নতুন কার্ড নম্বর আবশ্যক। / New card number is required.');
      if (db.rfidCards.some((card) => sameName(card.cardNumber, nextNum))) {
        return studentError(409, 'এই নতুন কার্ড নম্বরটি আগেই ব্যবহৃত হয়েছে। / This card number is already issued.');
      }
      const allowedOldStatuses: CardStatus[] = [
        CardStatus.LOST,
        CardStatus.DAMAGED,
        CardStatus.BLOCKED,
      ];
      const finalOldStatus = allowedOldStatuses.includes(oldCardStatus)
        ? oldCardStatus
        : CardStatus.BLOCKED;

      // Deactivate old card and any other active card for this student
      oldCard.status = finalOldStatus;
      oldCard.remarks = `নতুন কার্ড (${nextNum}) দ্বারা প্রতিস্থাপিত।`;
      oldCard.updatedAt = nowIso();
      db.rfidCards.forEach((item) => {
        if (item.id !== oldCard.id && item.studentId === student.id && item.status === CardStatus.ACTIVE) {
          item.status = CardStatus.BLOCKED;
          item.updatedAt = nowIso();
        }
      });

      const newCard = {
        id: uid('rfid'),
        studentId: student.id,
        cardNumber: nextNum,
        status: CardStatus.ACTIVE,
        issuedAt: nowIso(),
        remarks: remarks?.trim() || `পূর্বের কার্ড (${oldCard.cardNumber}) এর রিপ্লেসমেন্ট।`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.rfidCards.unshift(newCard);
      addAudit(
        'RFID_REPLACE',
        'Students',
        `Replaced RFID card ${oldCard.cardNumber} (${finalOldStatus}) with ${nextNum} for ${student.studentId}.`
      );
      return { data: clone({ oldCard, newCard }) };
    }

    // 18. Mark Notification(s) Read
    if (endpoint === '/students/promote' && method === 'POST') {
      const { toAcademicYearId, items } = body as {
        toAcademicYearId: string;
        items: Array<{
          studentId: string;
          fromEnrollmentId: string;
          toClassId?: string;
          toSectionId?: string;
          toGroupId?: string | null;
          roll?: number;
          resultSummaryId?: string | null;
          remarks?: string | null;
          promotionType: PromotionType | 'GRADUATED';
        }>;
      };
      if (!items.length) return studentError(400, 'কোনো শিক্ষার্থী নির্বাচিত নয়। / No students were selected.');
      const prepared: Array<{
        item: (typeof items)[number];
        from: StudentEnrollment;
        toClassId?: string;
        toSectionId?: string;
        toGroupId?: string | null;
      }> = [];
      for (const item of items) {
        const from = db.enrollments.find((row) => row.id === item.fromEnrollmentId && row.studentId === item.studentId);
        if (!from || from.status !== EnrollmentStatus.ACTIVE) {
          return studentError(400, 'শুধু চলতি ভর্তি থেকে উত্তরণ হয়। / Only an active enrollment can be moved.');
        }
        const student = db.students.find((row) => row.id === item.studentId);
        if (!student || student.status !== StudentStatus.ACTIVE) {
          return studentError(400, 'সক্রিয় শিক্ষার্থী ছাড়া উত্তরণ হয় না। / Only an active student can be moved.');
        }
        if (db.promotions.some((row) => row.fromEnrollmentId === from.id)) {
          return studentError(409, 'এই ভর্তি আগেই প্রক্রিয়া হয়েছে। / This enrollment was already processed.');
        }
        if (item.promotionType === 'GRADUATED') {
          prepared.push({ item, from });
          continue;
        }
        if (!toAcademicYearId || toAcademicYearId === from.academicYearId) {
          return studentError(400, 'পরের শিক্ষাবর্ষ আলাদা হতে হবে। / Choose a different academic year.');
        }
        const toClassId = item.promotionType === PromotionType.RETAINED ? from.classId : item.toClassId || '';
        const toSectionId = item.toSectionId || '';
        const keepsGroup = (db.classes.find((row) => row.id === toClassId)?.numericValue ?? 0) >= 9;
        const resolvedGroupId = keepsGroup ? (item.toGroupId ?? from.groupId ?? null) : null;
        const placed = placementError({
          academicYearId: toAcademicYearId,
          classId: toClassId,
          sectionId: toSectionId,
          groupId: resolvedGroupId,
          roll: Number(item.roll),
          studentId: item.studentId,
        });
        if (placed) return studentError(400, placed);
        prepared.push({ item, from, toClassId, toSectionId, toGroupId: resolvedGroupId });
      }
      const rolls = new Set<string>();
      for (const row of prepared) {
        if (!row.toClassId || !row.toSectionId) continue;
        const key = `${row.toClassId}|${row.toSectionId}|${row.item.roll}`;
        if (rolls.has(key)) return studentError(409, 'একই শাখায় একই রোল দুইজনকে দেওয়া হয়েছে। / Two students were given the same roll.');
        rolls.add(key);
      }
      let promoted = 0;
      let retained = 0;
      let graduated = 0;
      for (const row of prepared) {
        if (row.item.promotionType === 'GRADUATED') {
          row.from.status = EnrollmentStatus.COMPLETED;
          row.from.updatedAt = nowIso();
          const student = db.students.find((item) => item.id === row.item.studentId);
          if (student) student.status = StudentStatus.GRADUATED;
          graduated += 1;
          continue;
        }
        const next: StudentEnrollment = {
          id: uid('enr'),
          studentId: row.item.studentId,
          academicYearId: toAcademicYearId,
          classId: row.toClassId!,
          sectionId: row.toSectionId!,
          groupId: row.toGroupId ?? null,
          roll: Number(row.item.roll),
          enrollmentDate: nowIso().slice(0, 10),
          isRepeater: row.item.promotionType === PromotionType.RETAINED,
          isReadmission: false,
          status: EnrollmentStatus.ACTIVE,
          remarks: row.item.remarks?.trim() || null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        db.enrollments.unshift(next);
        row.from.status = row.item.promotionType === PromotionType.RETAINED ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PROMOTED;
        row.from.updatedAt = nowIso();
        db.promotions.unshift({
          id: uid('promo'),
          studentId: row.item.studentId,
          fromEnrollmentId: row.from.id,
          toEnrollmentId: next.id,
          resultSummaryId: row.item.resultSummaryId ?? null,
          promotionType: row.item.promotionType as PromotionType,
          promotionDate: nowIso().slice(0, 10),
          remarks: row.item.remarks?.trim() || null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        if (row.item.promotionType === PromotionType.RETAINED) retained += 1;
        else promoted += 1;
      }
      addAudit('STUDENT_PROMOTION', 'Students', `Promotion run: ${promoted} promoted, ${retained} retained, ${graduated} graduated.`);
      return { data: { promoted, retained, graduated } };
    }

    // 21. Archive / Restore Soft-Deletable Entity (Exam, GradingScale, StaffStructure)

  return null;
}
