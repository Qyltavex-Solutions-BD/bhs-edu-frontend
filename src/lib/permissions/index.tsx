'use client';

import React from 'react';
import { useAppSelector } from '@/src/store/hooks';

/**
 * SECURITY NOTICE:
 * Client-side permission checks exist strictly for UI ergonomics (hiding unauthorized
 * buttons/navigation items). They are NEVER security or authorization.
 * Real authorization MUST be enforced server-side on every REST API endpoint.
 */

export const PERMISSIONS = {
  INSTITUTION_MANAGE: 'institution.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_VIEW: 'audit.view',
  STAFF_MANAGE: 'staff.manage',
  ACADEMIC_MANAGE: 'academic.manage',
  STUDENTS_MANAGE: 'students.manage',
  PARENTS_MANAGE: 'parents.manage',
  ATTENDANCE_MARK: 'attendance.mark',
  ATTENDANCE_MANAGE: 'attendance.manage',
  EXAMS_MANAGE: 'exams.manage',
  MARKS_ENTER: 'marks.enter',
  RESULTS_PROCESS: 'results.process',
  RESULTS_PUBLISH: 'results.publish',
  LIBRARY_MANAGE: 'library.manage',
  DIGITAL_EDU_MANAGE: 'digital_education.manage',
  NOTICES_MANAGE: 'notices.manage',
  WEBSITE_MANAGE: 'website.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function usePermission(permission: PermissionKey | PermissionKey[]): boolean {
  const userPermissions = useAppSelector((s) => s.auth.permissions);
  const role = useAppSelector((s) => s.auth.role);
  if (role === 'SUPER_ADMIN') return true;
  if (Array.isArray(permission)) {
    return permission.some((p) => userPermissions.includes(p));
  }
  return userPermissions.includes(permission);
}

export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: PermissionKey | PermissionKey[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}
