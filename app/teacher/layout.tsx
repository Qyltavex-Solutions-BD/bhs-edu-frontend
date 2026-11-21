'use client';

import { PortalLayout } from '@/src/components/layout/PortalLayout';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="teacher">{children}</PortalLayout>;
}
