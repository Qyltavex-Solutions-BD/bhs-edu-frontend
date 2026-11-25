import { StaffStatus } from '@/src/types/enums';
import { db, sameName } from '../state';

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
