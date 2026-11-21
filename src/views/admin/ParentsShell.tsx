'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n';
import { PageHeader } from '@/src/components/shared/Feedback';
import { cn } from '@/src/lib/utils/cn';

const GROUPS = [
  {
    labelBn: 'তালিকা',
    labelEn: 'Records',
    items: [{ href: '/admin/parents', labelBn: 'ডিরেক্টরি', labelEn: 'Directory' }],
  },
  {
    labelBn: 'যোগাযোগ',
    labelEn: 'Contact',
    items: [{ href: '/admin/parents/coverage', labelBn: 'প্রাথমিক ও SMS', labelEn: 'Primary & SMS' }],
  },
];

export function ParentsShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { pick } = useI18n();

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <nav className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4" aria-label={pick('অভিভাবক মেনু', 'Guardian menu')}>
        <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-1">
          {GROUPS.map((group) => (
            <div key={group.labelEn} className="min-w-max lg:min-w-0">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {pick(group.labelBn, group.labelEn)}
              </p>
              <div className="mt-1 flex lg:flex-col gap-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href === '/admin/parents' &&
                      (pathname === '/admin/parents/create' ||
                        (pathname.startsWith('/admin/parents/') && !pathname.startsWith('/admin/parents/coverage'))));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm whitespace-nowrap',
                        active ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-surface-muted'
                      )}
                    >
                      {pick(item.labelBn, item.labelEn)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="flex-1 min-w-0 w-full space-y-5">
        <PageHeader title={title} description={description} actions={actions} />
        {children}
      </div>
    </div>
  );
}
