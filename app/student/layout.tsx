'use client';

import { PortalLayout } from '@/src/components/layout/PortalLayout';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="student">{children}</PortalLayout>;
}
