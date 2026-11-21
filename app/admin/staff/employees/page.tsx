import { AdminAcademicPage, AdminStaffPage, AdminUsersPage } from '@/src/views/admin/AdminCoreModules';

export default function Page() {
  return (
    <AdminStaffPage defaultTab="employees" />
  );
}
