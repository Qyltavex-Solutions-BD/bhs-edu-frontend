import type {
  Role,
  Permission,
  User,
  UserRole,
  RolePermission,
  AuditLog,
} from '@/src/types/entities';
import { PERMISSIONS } from '@/src/lib/permissions';
import { NOW } from './common';

export function createAuthFixtures() {
  const roles: Role[] = [
    { id: 'role-super-admin', name: 'SUPER_ADMIN', description: 'সিস্টেম সুপার অ্যাডমিন (পূর্ণ অধিকার)' },
    { id: 'role-school-admin', name: 'SCHOOL_ADMIN', description: 'বিদ্যালয় প্রশাসক' },
    { id: 'role-principal', name: 'PRINCIPAL', description: 'প্রধান শিক্ষক' },
    { id: 'role-teacher', name: 'TEACHER', description: 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষক' },
    { id: 'role-parent', name: 'PARENT', description: 'অভিভাবক' },
    { id: 'role-student', name: 'STUDENT', description: 'শিক্ষার্থী' },
    { id: 'role-accountant', name: 'ACCOUNTANT', description: 'হিসাবরক্ষক (ভবিষ্যৎ মডিউল)' },
    { id: 'role-librarian', name: 'LIBRARIAN', description: 'গ্রন্থাগারিক (ভবিষ্যৎ মডিউল)' },
    { id: 'role-staff', name: 'STAFF', description: 'অফিস সহায়ক ও কর্মচারী' },
  ];

  const permissions: Permission[] = Object.entries(PERMISSIONS).map(([k, v], i) => ({
    id: `perm-${i + 1}`,
    name: v,
    description: k.replace(/_/g, ' '),
  }));

  const users: User[] = [
    { id: 'user-admin', name: 'মোঃ রফিকুল ইসলাম (ডেমো অ্যাডমিন)', email: 'admin@bhs.edu.bd', phone: '01711000001', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-principal', name: 'প্রধান শিক্ষক (ডেমো প্রোফাইল)', email: 'principal@bhs.edu.bd', phone: '01711000002', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-teacher-1', name: 'মোঃ কামরুল হাসান (ডেমো শিক্ষক)', email: 'kamrul@bhs.edu.bd', phone: '01711000003', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-teacher-2', name: 'সাবিনা ইয়াসমিন (ডেমো শিক্ষক)', email: 'sabina@bhs.edu.bd', phone: '01711000004', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-parent-1', name: 'মোঃ আবুল কালাম (ডেমো অভিভাবক)', email: 'parent@bhs.edu.bd', phone: '01711000010', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-student-1', name: 'তানভীর আহমেদ (ডেমো শিক্ষার্থী)', email: 'student@bhs.edu.bd', phone: '01711000020', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const userRoles: UserRole[] = [
    { id: 'ur-1', userId: 'user-admin', roleId: 'role-super-admin' },
    { id: 'ur-2', userId: 'user-principal', roleId: 'role-principal' },
    { id: 'ur-3', userId: 'user-teacher-1', roleId: 'role-teacher' },
    { id: 'ur-4', userId: 'user-teacher-2', roleId: 'role-teacher' },
    { id: 'ur-5', userId: 'user-parent-1', roleId: 'role-parent' },
    { id: 'ur-6', userId: 'user-student-1', roleId: 'role-student' },
  ];

  const rolePermissions: RolePermission[] = [];
  permissions.forEach((p, idx) => {
    rolePermissions.push({ id: `rp-sa-${idx}`, roleId: 'role-super-admin', permissionId: p.id });
    if (p.name !== PERMISSIONS.ROLES_MANAGE) {
      rolePermissions.push({ id: `rp-adm-${idx}`, roleId: 'role-school-admin', permissionId: p.id });
    }
    if ([PERMISSIONS.REPORTS_VIEW, PERMISSIONS.RESULTS_PUBLISH, PERMISSIONS.NOTICES_MANAGE, PERMISSIONS.AUDIT_VIEW].includes(p.name as never)) {
      rolePermissions.push({ id: `rp-pr-${idx}`, roleId: 'role-principal', permissionId: p.id });
    }
    if ([PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.MARKS_ENTER].includes(p.name as never)) {
      rolePermissions.push({ id: `rp-tc-${idx}`, roleId: 'role-teacher', permissionId: p.id });
    }
  });

  const auditLogs: AuditLog[] = [
    { id: 'aud-1', userId: 'user-admin', action: 'RESULT_PUBLISH', module: 'Results', details: 'Published Half-Yearly Examination 2026 results for Class 10 (SSC Batch).', ipAddress: '103.112.54.18', createdAt: '2026-11-18T11:30:00.000Z' },
    { id: 'aud-2', userId: 'user-teacher-1', action: 'MARKS_SUBMIT', module: 'Examinations', details: 'Submitted Mathematics marks for Class 10 Section ক.', ipAddress: '103.112.54.22', createdAt: '2026-11-17T14:15:00.000Z' },
    { id: 'aud-3', userId: 'user-admin', action: 'ATTENDANCE_CONFIG_UPDATE', module: 'Attendance', details: 'Configured Class 10 attendance method to RFID and Classes 6–9 to MANUAL.', ipAddress: '103.112.54.18', createdAt: '2026-11-16T08:40:00.000Z' },
    { id: 'aud-5', userId: 'user-admin', action: 'STUDENT_ENROLL', module: 'Students', details: 'Enrolled Class 6 incoming batch for Academic Year 2026.', ipAddress: '103.112.54.18', createdAt: '2026-11-12T09:10:00.000Z' },
  ];


  return {
    roles,
    permissions,
    users,
    userRoles,
    rolePermissions,
    auditLogs,
  };
}
