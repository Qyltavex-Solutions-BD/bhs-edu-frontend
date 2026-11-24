import { db, clone, uid, nowIso, addAudit, sameName } from '../state';
import {
  BloodGroup,
  DepartmentStatus,
  EmploymentType,
  Gender,
  Religion,
  StaffStatus,
  StaffType,
} from '@/src/types/enums';
import type {
  Department,
  Staff,
  StaffStructure,
} from '@/src/types/entities';
import type { MockHandlerResult } from './types';
import { studentError } from './helpers';

export function occupiedPosts(designation: string, staffType: string, departmentId: string | null, ignoreId?: string) {
  return db.staff.filter(
    (member) =>
      member.id !== ignoreId &&
      member.status === StaffStatus.ACTIVE &&
      member.staffType === staffType &&
      sameName(member.designation, designation) &&
      (member.departmentId ?? null) === departmentId
  ).length;
}

function postLimitError(designation: string, staffType: string, departmentId: string | null, ignoreId?: string) {
  const structure = db.staffStructures.find(
    (row) =>
      !row.isDeleted &&
      row.isActive &&
      row.staffType === staffType &&
      sameName(row.designation, designation) &&
      (row.departmentId ?? null) === departmentId
  );
  if (!structure) return null;
  if (occupiedPosts(designation, staffType, departmentId, ignoreId) >= structure.totalPositions) {
    return 'এই পদের অনুমোদিত আসন পূর্ণ। / Every sanctioned post for this designation is filled.';
  }
  return null;
}

function hasTeachingDuty(staffId: string) {
  return (
    db.teacherAssignments.some((row) => row.staffId === staffId && row.isActive) ||
    db.sectionClassTeachers.some((row) => row.staffId === staffId)
  );
}

function refreshFilledPosts() {
  db.staffStructures.forEach((structure) => {
    structure.filledPositions = occupiedPosts(structure.designation, structure.staffType, structure.departmentId ?? null);
  });
}


export function handleStaffMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
    if (endpoint === '/staff' && method === 'POST') {
      const payload = body as Partial<Staff>;
      const name = payload.name?.trim() ?? '';
      const designation = payload.designation?.trim() ?? '';
      if (!name || !designation || !payload.staffType) {
        return studentError(400, 'নাম, পদবি ও ধরন আবশ্যক। / Name, designation, and type are required.');
      }
      const employeeId = payload.employeeId?.trim() || `EMP-${String(db.staff.length + 11).padStart(3, '0')}`;
      if (db.staff.some((member) => member.employeeId && sameName(member.employeeId, employeeId))) {
        return studentError(409, 'এই স্টাফ আইডি আগে ব্যবহার হয়েছে। / This staff ID is already used.');
      }
      const nid = payload.nid?.trim();
      if (nid && db.staff.some((member) => member.nid && sameName(member.nid, nid))) {
        return studentError(409, 'এই এনআইডি আরেকজন স্টাফের। / This NID already belongs to a staff member.');
      }
      if (payload.email?.trim() && !payload.email.includes('@')) return studentError(400, 'ইমেইল সঠিক নয়। / Email is not valid.');
      if (payload.phone?.trim() && payload.phone.replace(/\D/g, '').length < 11) {
        return studentError(400, 'মোবাইল কমপক্ষে ১১ সংখ্যার হতে হবে। / Phone must be at least 11 digits.');
      }
      const departmentId = payload.departmentId || null;
      if (departmentId) {
        const department = db.departments.find((item) => item.id === departmentId);
        if (!department || department.status !== 'ACTIVE') {
          return studentError(400, 'সক্রিয় বিভাগ বেছে নিন। / Choose an active department.');
        }
      }
      const limit = postLimitError(designation, payload.staffType, departmentId);
      if (limit) return studentError(409, limit);
      const created: Staff = {
        id: uid('staff'),
        employeeId,
        name,
        nameBn: payload.nameBn?.trim() || name,
        designation,
        qualification: payload.qualification?.trim() || null,
        staffType: payload.staffType,
        departmentId,
        employmentType: payload.employmentType ?? ('PERMANENT' as Staff['employmentType']),
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
        nid: nid || null,
        joiningDate: payload.joiningDate || nowIso().slice(0, 10),
        displayOrder: db.staff.length + 1,
        status: StaffStatus.ACTIVE,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.staff.unshift(created);
      refreshFilledPosts();
      addAudit('STAFF_CREATE', 'Staff', `Added staff member ${created.name} (${created.employeeId}).`);
      return { data: clone(created) };
    }

    if (endpoint === '/staff/update' && method === 'POST') {
      const payload = body as Partial<Staff> & { id: string };
      const member = db.staff.find((item) => item.id === payload.id);
      if (!member) return studentError(404, 'স্টাফ পাওয়া যায়নি। / Staff member was not found.');
      const name = (payload.name ?? member.name).trim();
      const designation = (payload.designation ?? member.designation).trim();
      const staffType = payload.staffType ?? member.staffType;
      const departmentId = payload.departmentId === undefined ? member.departmentId ?? null : payload.departmentId || null;
      const status = payload.status ?? member.status;
      if (!name || !designation) return studentError(400, 'নাম ও পদবি আবশ্যক। / Name and designation are required.');
      const employeeId = (payload.employeeId ?? member.employeeId ?? '').trim();
      if (employeeId && db.staff.some((item) => item.id !== member.id && item.employeeId && sameName(item.employeeId, employeeId))) {
        return studentError(409, 'এই স্টাফ আইডি আগে ব্যবহার হয়েছে। / This staff ID is already used.');
      }
      const nid = payload.nid?.trim() || null;
      if (nid && db.staff.some((item) => item.id !== member.id && item.nid && sameName(item.nid, nid))) {
        return studentError(409, 'এই এনআইডি আরেকজন স্টাফের। / This NID already belongs to a staff member.');
      }
      if (payload.email?.trim() && !payload.email.includes('@')) return studentError(400, 'ইমেইল সঠিক নয়। / Email is not valid.');
      if (departmentId) {
        const department = db.departments.find((item) => item.id === departmentId);
        if (!department) return studentError(400, 'বিভাগ পাওয়া যায়নি। / Department was not found.');
      }
      if (status !== StaffStatus.ACTIVE && hasTeachingDuty(member.id)) {
        return studentError(409, 'আগে শ্রেণি শিক্ষক ও বিষয় শিক্ষকের দায়িত্ব ছাড়ান। / Release class-teacher and subject-teacher duties first.');
      }
      if (status !== StaffStatus.ACTIVE && !payload.leavingDate && !member.leavingDate) {
        return studentError(400, 'চাকরি ছাড়ার তারিখ আবশ্যক। / A leaving date is required.');
      }
      if (status === StaffStatus.ACTIVE) {
        const limit = postLimitError(designation, staffType, departmentId, member.id);
        if (limit) return studentError(409, limit);
      }
      member.name = name;
      member.nameBn = payload.nameBn?.trim() || name;
      member.employeeId = employeeId || null;
      member.designation = designation;
      member.staffType = staffType;
      member.departmentId = departmentId;
      member.employmentType = payload.employmentType ?? member.employmentType;
      member.qualification = payload.qualification?.trim() || null;
      member.phone = payload.phone?.trim() || null;
      member.email = payload.email?.trim() || null;
      member.nid = nid;
      member.gender = payload.gender === undefined ? member.gender ?? null : payload.gender;
      member.dateOfBirth = payload.dateOfBirth || null;
      member.bloodGroup = payload.bloodGroup === undefined ? member.bloodGroup ?? null : payload.bloodGroup;
      member.religion = payload.religion ?? member.religion ?? null;
      member.fatherName = payload.fatherName?.trim() || null;
      member.motherName = payload.motherName?.trim() || null;
      member.presentAddress = payload.presentAddress?.trim() || null;
      member.permanentAddress = payload.permanentAddress?.trim() || null;
      member.emergencyContact = payload.emergencyContact?.trim() || null;
      member.joiningDate = payload.joiningDate || member.joiningDate || null;
      member.status = status;
      member.leavingDate = status === StaffStatus.ACTIVE ? null : payload.leavingDate || member.leavingDate || null;
      member.updatedAt = nowIso();
      refreshFilledPosts();
      addAudit('STAFF_UPDATE', 'Staff', `Updated ${member.employeeId ?? member.name}.`);
      return { data: clone(member) };
    }

    if (endpoint === '/staff/departments' && method === 'POST') {
      const payload = body as Partial<(typeof db.departments)[number]> & { id?: string };
      const name = payload.name?.trim() ?? '';
      if (!name) return studentError(400, 'বিভাগের নাম আবশ্যক। / Department name is required.');
      const code = payload.code?.trim() || null;
      const duplicate = db.departments.find(
        (item) => item.id !== payload.id && (sameName(item.name, name) || (code && item.code && sameName(item.code, code)))
      );
      if (duplicate) return studentError(409, 'এই নাম বা কোডের বিভাগ আছে। / A department with this name or code already exists.');
      if (payload.id) {
        const department = db.departments.find((item) => item.id === payload.id);
        if (!department) return studentError(404, 'বিভাগ পাওয়া যায়নি। / Department was not found.');
        department.name = name;
        department.code = code;
        department.description = payload.description?.trim() || null;
        department.displayOrder = Number(payload.displayOrder ?? department.displayOrder);
        department.status = payload.status ?? department.status;
        department.updatedAt = nowIso();
        addAudit('DEPARTMENT_UPDATE', 'Staff', `Updated department ${department.name}.`);
        return { data: clone(department) };
      }
      const created = {
        id: uid('dept'),
        name,
        code,
        description: payload.description?.trim() || null,
        displayOrder: db.departments.length + 1,
        status: payload.status ?? ('ACTIVE' as (typeof db.departments)[number]['status']),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.departments.push(created);
      addAudit('DEPARTMENT_CREATE', 'Staff', `Added department ${created.name}.`);
      return { data: clone(created) };
    }

    if (endpoint === '/staff/departments/remove' && method === 'POST') {
      const { id } = body as { id: string };
      if (db.staff.some((member) => member.departmentId === id) || db.staffStructures.some((row) => row.departmentId === id && !row.isDeleted)) {
        return studentError(409, 'স্টাফ বা পদ থাকলে বিভাগ মুছা যায় না। / Move staff and posts out before deleting this department.');
      }
      const department = db.departments.find((item) => item.id === id);
      if (!department) return studentError(404, 'বিভাগ পাওয়া যায়নি। / Department was not found.');
      db.departments = db.departments.filter((item) => item.id !== id);
      addAudit('DEPARTMENT_REMOVE', 'Staff', `Removed department ${department.name}.`);
      return { data: { id } };
    }

    if (endpoint === '/staff/structures' && method === 'POST') {
      const payload = body as Partial<(typeof db.staffStructures)[number]> & { id?: string };
      const designation = payload.designation?.trim() ?? '';
      const totalPositions = Number(payload.totalPositions);
      if (!designation || !payload.staffType || !Number.isInteger(totalPositions) || totalPositions < 1) {
        return studentError(400, 'পদবি, ধরন ও কমপক্ষে ১টি আসন আবশ্যক। / Designation, type, and at least one post are required.');
      }
      const departmentId = payload.departmentId || null;
      if (departmentId && !db.departments.some((item) => item.id === departmentId)) {
        return studentError(400, 'বিভাগ পাওয়া যায়নি। / Department was not found.');
      }
      const duplicate = db.staffStructures.find(
        (row) =>
          !row.isDeleted &&
          row.id !== payload.id &&
          row.staffType === payload.staffType &&
          sameName(row.designation, designation) &&
          (row.departmentId ?? null) === departmentId
      );
      if (duplicate) return studentError(409, 'এই বিভাগে এই পদ আগেই আছে। / This post already exists in that department.');
      const filled = occupiedPosts(designation, payload.staffType, departmentId);
      if (totalPositions < filled) {
        return studentError(400, `এই পদে এখন ${filled} জন আছেন। আসন তার চেয়ে কম হতে পারে না। / ${filled} people already hold this post.`);
      }
      if (payload.id) {
        const structure = db.staffStructures.find((row) => row.id === payload.id);
        if (!structure) return studentError(404, 'পদ পাওয়া যায়নি। / Post was not found.');
        structure.designation = designation;
        structure.staffType = payload.staffType;
        structure.departmentId = departmentId;
        structure.totalPositions = totalPositions;
        structure.isActive = payload.isActive ?? structure.isActive;
        structure.updatedAt = nowIso();
        refreshFilledPosts();
        addAudit('POST_UPDATE', 'Staff', `Updated post ${structure.designation}.`);
        return { data: clone(structure) };
      }
      const created = {
        id: uid('post'),
        designation,
        staffType: payload.staffType,
        departmentId,
        totalPositions,
        filledPositions: filled,
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.staffStructures.push(created);
      addAudit('POST_CREATE', 'Staff', `Added post ${created.designation}.`);
      return { data: clone(created) };
    }

    // 17. RFID Card Issue, Status Update & Atomic Replacement

  return null;
}
