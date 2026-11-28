'use client';

import { usePathname } from 'next/navigation';
import { PortalLayout } from '@/src/components/layout/PortalLayout';

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/accountant/login') {
    return <>{children}</>;
  }
  return <PortalLayout portal="accountant">{children}</PortalLayout>;
}
