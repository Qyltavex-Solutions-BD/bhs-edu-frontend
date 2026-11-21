'use client';

import { PortalLayout } from '@/src/components/layout/PortalLayout';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout portal="parent">{children}</PortalLayout>;
}
