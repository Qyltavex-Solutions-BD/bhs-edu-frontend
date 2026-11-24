import { db, nowIso, uid } from '../state';
import { RelationshipType } from '@/src/types/enums';

export function studentError(status: number, message: string) {
  return { error: { status, message } };
}

export function placementError(input: {
  academicYearId: string;
  classId: string;
  sectionId?: string | null;
  groupId?: string | null;
  studentId?: string | null;
  roll?: number | string | null;
  ignoreEnrollmentId?: string;
  ignoreStudentId?: string;
}) {
  const roll = Number(input.roll);
  if (!roll || roll < 1) {
    return 'রোল নম্বর ১ বা তার বেশি হতে হবে। / Roll must be positive integer.';
  }

  const existingWithSameRoll = db.enrollments.find((item) => {
    if (item.id === input.ignoreEnrollmentId) return false;
    if (input.ignoreStudentId && item.studentId === input.ignoreStudentId) return false;
    if (item.academicYearId !== input.academicYearId) return false;
    if (item.classId !== input.classId) return false;
    if (input.sectionId && item.sectionId !== input.sectionId) return false;
    return Number(item.roll) === roll;
  });

  if (existingWithSameRoll) {
    return `একই শিক্ষাবর্ষ ও শ্রেণিতে রোল ${roll} ইতোমধ্যে বরাদ্দ রয়েছে। / Roll ${roll} is already assigned.`;
  }

  return null;
}

export function identityError(input: {
  birthCertificateNo?: string | null;
  boardRegistrationNo?: string | null;
  ignoreStudentId?: string;
}) {
  const bc = input.birthCertificateNo?.trim();
  if (bc && db.students.some((s) => s.id !== input.ignoreStudentId && s.birthCertificateNo === bc)) {
    return 'এই জন্ম নিবন্ধন নম্বরটি ইতোমধ্যে ব্যবহৃত হয়েছে। / Birth certificate number already registered.';
  }
  const reg = input.boardRegistrationNo?.trim();
  if (reg && db.students.some((s) => s.id !== input.ignoreStudentId && s.boardRegistrationNo === reg)) {
    return 'এই বোর্ড রেজিস্ট্রেশন নম্বরটি ইতোমধ্যে ব্যবহৃত হয়েছে। / Board registration number already registered.';
  }
  return null;
}

export function parentProfileError(input: {
  phone: string;
  nid?: string | null;
  email?: string | null;
  ignoreId?: string;
}) {
  const phone = input.phone.trim();
  if (phone.replace(/\D/g, '').length < 11) {
    return 'মোবাইল কমপক্ষে ১১ সংখ্যার হতে হবে। / Phone must be at least 11 digits.';
  }
  if (db.parents.some((item) => item.id !== input.ignoreId && item.phone.trim() === phone)) {
    return 'এই মোবাইল আরেকজন অভিভাবকের। / This phone already belongs to a guardian.';
  }
  const nid = input.nid?.trim();
  if (nid && db.parents.some((item) => item.id !== input.ignoreId && item.nid === nid)) {
    return 'এই এনআইডি আরেকজন অভিভাবকের। / This NID is already used.';
  }
  const email = input.email?.trim();
  if (email && !email.includes('@')) return 'ইমেইল সঠিক নয়। / Email is not valid.';
  return null;
}

export function linkGuardian(
  studentId: string,
  input: {
    name: string;
    nameBn?: string | null;
    phone: string;
    occupation?: string | null;
    nid?: string | null;
    address?: string | null;
    relationship?: RelationshipType;
    sms?: boolean;
    emergency?: boolean;
  }
) {
  const phone = input.phone.trim();
  let parent = db.parents.find((item) => item.phone === phone);
  if (!parent) {
    parent = {
      id: uid('par'),
      name: input.name.trim(),
      nameBn: input.nameBn?.trim() || null,
      phone,
      occupation: input.occupation?.trim() || null,
      nid: input.nid?.trim() || null,
      address: input.address?.trim() || null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.parents.unshift(parent);
  }
  if (!db.parentStudents.some((link) => link.parentId === parent.id && link.studentId === studentId)) {
    db.parentStudents.unshift({
      id: uid('ps'),
      parentId: parent.id,
      studentId,
      relationship: input.relationship ?? RelationshipType.FATHER,
      isPrimary: !db.parentStudents.some((link) => link.studentId === studentId && link.isPrimary),
      isEmergencyContact: input.emergency !== false,
      isSmsReceiver: input.sms !== false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
}
