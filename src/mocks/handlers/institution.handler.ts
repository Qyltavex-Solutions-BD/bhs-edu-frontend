import { db, clone, uid, nowIso, addAudit, sameName } from '../state';
import {
  BloodGroup,
  CardStatus,
  EnrollmentStatus,
  Gender,
  RelationshipType,
  Religion,
  StudentStatus,
} from '@/src/types/enums';
import type {
  AdmissionContent,
  ContactInformation,
  SchoolProfile,
  Student,
} from '@/src/types/entities';
import type { AdmissionApplicationStatus } from '@/src/types/proposed/future';
import type { MockHandlerResult } from './types';
import { studentError, placementError, identityError, linkGuardian } from './helpers';
import { occupiedPosts } from './staff.handler';

export function handleInstitutionMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
    // 4. Update Admission Application Status / One-Click Admit into Students
    if (endpoint === '/admin/admissions/status' && method === 'POST') {
      const { id, status, sectionId, roll, academicYearId, formSerialNo, verifiedDocuments } = body as {
        id: string;
        status: AdmissionApplicationStatus;
        sectionId?: string;
        roll?: number;
        academicYearId?: string;
        formSerialNo?: string;
        verifiedDocuments?: Record<string, boolean>;
      };
      const app = db.onlineAdmissions.find((a) => a.id === id);
      if (!app) return studentError(404, 'আবেদন পাওয়া যায়নি। / Application was not found.');
      if (app.status === 'ADMITTED') {
        return studentError(409, 'এই আবেদন আগেই ভর্তি করা হয়েছে। / This application is already admitted.');
      }
      if (status !== 'ADMITTED') {
        app.status = status;
        addAudit('ADMISSION_STATUS', 'Students', `Set ${app.applicationNumber} to ${status}.`);
        return { data: clone(app) };
      }
      const yearId = academicYearId || db.academicYears.find((year) => year.isActive)?.id || '';
      const section =
        db.sections.find((item) => item.id === sectionId && item.classId === app.targetClassId) ||
        db.sections.find(
          (item) => item.classId === app.targetClassId && app.preferredSection && sameName(item.name, app.preferredSection)
        );
      if (!section) return studentError(400, 'ভর্তির শাখা বেছে নিন। / Choose a section for this admission.');
      const nextRoll = Number(roll);
      const placed = placementError({
        academicYearId: yearId,
        classId: app.targetClassId,
        sectionId: section.id,
        groupId: app.targetGroupId ?? null,
        roll: nextRoll,
      });
      if (placed) return studentError(400, placed);
      const identity = identityError({
        birthCertificateNo: app.birthCertificateNo,
        boardRegistrationNo: app.boardRegistrationNo ?? null,
      });
      if (identity) return studentError(409, identity);
      const stuId = uid('stu');
      const newStudent: Student = {
        id: stuId,
        studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
        birthCertificateNo: app.birthCertificateNo,
        boardRegistrationNo: app.boardRegistrationNo ?? null,
        nameEn: app.studentNameEn,
        nameBn: app.studentNameBn,
        photo: app.photoPreview ?? null,
        dateOfBirth: app.dateOfBirth,
        gender: app.gender,
        bloodGroup: app.bloodGroup ?? null,
        religion: app.religion,
        nationality: app.nationality ?? 'বাংলাদেশি',
        studentPhone: app.studentPhone ?? null,
        presentAddress: app.presentAddress,
        permanentAddress: app.permanentAddress,
        admissionDate: nowIso().slice(0, 10),
        admissionType: app.admissionType ?? (app.isReadmission ? 'READMISSION' : 'NEW'),
        status: StudentStatus.ACTIVE,
        previousSchoolName: app.previousSchoolName ?? null,
        previousSchoolEiin: app.previousSchoolEiin ?? null,
        previousSchoolAddress: app.previousSchoolAddress ?? null,
        previousGrade: app.previousGrade ?? null,
        prevExamPassingYear: app.prevExamPassingYear ?? null,
        prevExamRoll: app.prevExamRoll ?? null,
        prevExamRegistration: app.prevExamRegistration ?? null,
        prevExamGpa: app.prevExamGpa ?? null,
        transferCertificateNo: app.transferCertificateNo ?? null,
        transferCertificateDate: app.transferCertificateDate ?? null,
        verifiedDocuments: verifiedDocuments ?? app.verifiedDocuments ?? null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.students.unshift(newStudent);
      db.enrollments.unshift({
        id: uid('enr'),
        studentId: stuId,
        academicYearId: yearId,
        classId: app.targetClassId,
        sectionId: section.id,
        groupId: app.targetGroupId ?? null,
        optionalClassSubjectId: app.optionalClassSubjectId ?? null,
        roll: nextRoll,
        enrollmentDate: nowIso().slice(0, 10),
        formSerialNo: formSerialNo || app.applicationNumber,
        isRepeater: false,
        isReadmission: app.isReadmission || app.admissionType === 'READMISSION',
        status: EnrollmentStatus.ACTIVE,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      const bothDeceased = app.fatherAlive === false && app.motherAlive === false;
      const primaryRole =
        app.primaryGuardianType ??
        (bothDeceased
          ? 'LEGAL_GUARDIAN'
          : app.fatherAlive !== false
            ? 'FATHER'
            : 'MOTHER');
      linkGuardian(stuId, {
        name: app.fatherNameEn,
        nameBn: app.fatherNameBn,
        phone: app.fatherPhone || (app.fatherAlive !== false ? app.guardianPhone : `deceased-f-${uid('p')}`),
        occupation: app.fatherAlive === false ? 'মৃত' : app.fatherOccupation,
        nid: app.fatherNid || null,
        address: app.presentAddress,
        relationship: RelationshipType.FATHER,
        sms: primaryRole === 'FATHER' && app.fatherAlive !== false,
      });
      linkGuardian(stuId, {
        name: app.motherNameEn,
        nameBn: app.motherNameBn,
        phone: app.motherPhone || `mother-${uid('p')}`,
        occupation: app.motherAlive === false ? 'মৃত' : app.motherOccupation,
        nid: app.motherNid || null,
        address: app.presentAddress,
        relationship: RelationshipType.MOTHER,
        sms: primaryRole === 'MOTHER' && app.motherAlive !== false,
      });
      if (app.legalGuardianNameBn && app.legalGuardianPhone) {
        linkGuardian(stuId, {
          name: app.legalGuardianNameEn || app.legalGuardianNameBn,
          nameBn: app.legalGuardianNameBn,
          phone: app.legalGuardianPhone,
          occupation: app.legalGuardianRelation || 'অভিভাবক',
          nid: app.legalGuardianNid || null,
          address: app.legalGuardianAddress || app.presentAddress,
          relationship: RelationshipType.GUARDIAN,
          sms: primaryRole === 'LEGAL_GUARDIAN' || bothDeceased,
        });
      }
      if (verifiedDocuments) {
        app.verifiedDocuments = verifiedDocuments;
      }
      app.status = 'ADMITTED';
      addAudit('ADMISSION_ADMIT', 'Students', `Admitted ${app.applicationNumber} as ${newStudent.studentId}, roll ${nextRoll}.`);
      return { data: clone(app) };
    }

    // 5. Update School Profile
    if (endpoint === '/admin/institution/profile' && method === 'PUT') {
      db.schoolProfile = { ...db.schoolProfile, ...(body as Partial<SchoolProfile>), updatedAt: nowIso() };
      addAudit('PROFILE_UPDATE', 'Institution', 'Updated official school profile configuration.');
      return { data: clone(db.schoolProfile) };
    }

    if (endpoint === '/archive/toggle' && method === 'POST') {
      const { collection, id } = body as {
        collection: 'exams' | 'gradingScales' | 'staffStructures';
        id: string;
      };
      const target = (db[collection] as Array<{ id: string; isDeleted: boolean; deletedAt?: string | null }>).find(
        (x) => x.id === id
      );
      if (!target) return { error: { status: 404, message: 'Record not found' } };
      if (collection === 'staffStructures' && !target.isDeleted) {
        const structure = db.staffStructures.find((row) => row.id === id);
        if (structure && occupiedPosts(structure.designation, structure.staffType, structure.departmentId ?? null) > 0) {
          return studentError(409, 'এই পদে এখনো লোক আছেন। আগে তাঁদের সরিয়ে আর্কাইভ করুন। / People still hold this post.');
        }
      }
      target.isDeleted = !target.isDeleted;
      target.deletedAt = target.isDeleted ? nowIso() : null;
      addAudit(target.isDeleted ? 'ARCHIVE' : 'RESTORE', collection, `Toggled archive state for ${id}.`);
      return { data: clone(target) };
    }

    // 22. Generic Website / Banner / QuickLink Publish Toggle
    if (endpoint === '/cms/toggle' && method === 'POST') {
      const { collection, id, field } = body as {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'notices'
          | 'news'
          | 'events'
          | 'careers'
          | 'publications'
          | 'achievements'
          | 'digitalResources'
          | 'digitalClassrooms'
          | 'libraryDistributions'
          | 'leadershipMessages'
          | 'institutionContents'
          | 'facilities'
          | 'galleries';
        id: string;
        field: 'isActive' | 'isPublished';
      };
      const item = (db[collection] as unknown as Array<Record<string, unknown>>).find((x) => x.id === id);
      if (!item) return { error: { status: 404, message: 'CMS item not found' } };
      item[field] = !Boolean(item[field]);
      if ('updatedAt' in item) item.updatedAt = nowIso();
      addAudit('CMS_TOGGLE', 'Website', `Toggled ${field} on ${collection}/${id}.`);
      return { data: clone(item) };
    }

    // 22b. Update Admission Campaign & Homepage Spotlight Settings
    if (endpoint === '/cms/admission-content' && method === 'PUT') {
      const patch = body as Partial<typeof db.admissionContent>;
      db.admissionContent = {
        ...db.admissionContent,
        ...patch,
        updatedAt: nowIso(),
      };
      addAudit(
        'ADMISSION_CMS_UPDATE',
        'Website',
        `Updated admission campaign settings (status: ${db.admissionContent.admissionStatus ?? 'OPEN'}, homepage: ${db.admissionContent.showOnHomepage ? 'visible' : 'hidden'}).`
      );
      return { data: clone(db.admissionContent) };
    }

    // 23. Create Exam
    if (endpoint === '/cms/reorder' && method === 'POST') {
      const { collection, orderedIds } = body as {
        collection: 'banners' | 'quickLinks';
        orderedIds: string[];
      };
      const items = db[collection];
      orderedIds.forEach((id, idx) => {
        const match = items.find((item) => item.id === id);
        if (match) match.sortOrder = idx + 1;
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      addAudit('CMS_REORDER', 'Website', `Reordered ${collection} (${orderedIds.length} items).`);
      return { data: clone(items) };
    }

    // 25. Drag-and-Drop Move Class Routine Period with Conflict Check
    if (endpoint === '/cms/upsert' && method === 'POST') {
      const { collection, item } = body as {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'institutionContents'
          | 'facilities'
          | 'leadershipMessages'
          | 'managingCommittee'
          | 'news'
          | 'events'
          | 'careers'
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements'
          | 'libraryBooks'
          | 'libraryDistributions'
          | 'digitalClassrooms'
          | 'digitalResources'
          | 'examRoutines';
        item: Record<string, unknown>;
      };
      const list = db[collection] as unknown as Array<Record<string, unknown>>;
      const existingId = typeof item.id === 'string' && item.id.trim() ? item.id : null;
      const existingIdx = existingId ? list.findIndex((x) => x.id === existingId) : -1;

      if (existingIdx >= 0) {
        const updated = {
          ...list[existingIdx],
          ...item,
          updatedAt: nowIso(),
        };
        list[existingIdx] = updated;
        addAudit('CMS_UPDATE', 'Operations', `Updated ${collection}/${existingId}.`);
        return { data: clone(updated) };
      }

      const created: Record<string, unknown> = {
        ...item,
        id: uid(collection.slice(0, 3)),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if ((collection === 'banners' || collection === 'quickLinks' || collection === 'galleryMedia') && !created.sortOrder) {
        created.sortOrder = list.length + 1;
      }
      if (
        collection === 'news' ||
        collection === 'events' ||
        collection === 'careers' ||
        collection === 'galleries' ||
        collection === 'publications' ||
        collection === 'achievements' ||
        collection === 'libraryBooks' ||
        collection === 'digitalResources'
      ) {
        list.unshift(created);
      } else {
        list.push(created);
      }
      addAudit('CMS_CREATE', 'Operations', `Created ${collection}/${String(created.id)}.`);
      return { data: clone(created) };
    }

    // 29. Unified CMS & Operations Collection Delete
    if (endpoint === '/cms/delete' && method === 'POST') {
      const { collection, id } = body as {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'institutionContents'
          | 'facilities'
          | 'leadershipMessages'
          | 'managingCommittee'
          | 'news'
          | 'events'
          | 'careers'
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements'
          | 'libraryBooks'
          | 'libraryDistributions'
          | 'digitalClassrooms'
          | 'digitalResources'
          | 'examRoutines';
        id: string;
      };
      const list = db[collection] as unknown as Array<Record<string, unknown>>;
      const idx = list.findIndex((x) => x.id === id);
      if (idx < 0) return { error: { status: 404, message: 'Item not found' } };
      list.splice(idx, 1);
      addAudit('CMS_DELETE', 'Operations', `Deleted ${collection}/${id}.`);
      return { data: { deletedId: id } };
    }

    // 30. Update Website Contact Information
    if (endpoint === '/cms/contact-info' && method === 'PUT') {
      const patch = body as {
        address: string;
        phone?: string | null;
        email?: string | null;
        mapUrl?: string | null;
      };
      db.contactInfo = {
        ...db.contactInfo,
        address: patch.address,
        phone: patch.phone ?? db.contactInfo.phone,
        email: patch.email ?? db.contactInfo.email,
        mapUrl: patch.mapUrl ?? db.contactInfo.mapUrl,
        updatedAt: nowIso(),
      };
      addAudit('CONTACT_CMS_UPDATE', 'Website', 'Updated public contact information and map link.');
      return { data: clone(db.contactInfo) };
    }


  return null;
}
