'use client';

import React from 'react';
import { GraduationCap, Loader2, ShieldCheck, Users } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';

export interface DemoAccount {
  key: 'TEACHER' | 'PARENT';
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  email: string;
  password: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'TEACHER',
    labelBn: 'শিক্ষক',
    labelEn: 'Teacher',
    descBn: 'শিক্ষক ড্যাশবোর্ড',
    descEn: 'Teacher Portal',
    email: process.env.NEXT_PUBLIC_DEMO_TEACHER_EMAIL || 'teacher@example.com',
    password: process.env.NEXT_PUBLIC_DEMO_TEACHER_PASSWORD || 'teacherpassword',
    icon: GraduationCap,
    accentClass: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  },
  {
    key: 'PARENT',
    labelBn: 'অভিভাবক',
    labelEn: 'Parent',
    descBn: 'অভিভাবক পোর্টাল',
    descEn: 'Parent Portal',
    email: process.env.NEXT_PUBLIC_DEMO_PARENT_EMAIL || 'parent@example.com',
    password: process.env.NEXT_PUBLIC_DEMO_PARENT_PASSWORD || 'parentpassword',
    icon: Users,
    accentClass: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  },
];

interface DemoLoginCardsProps {
  onSelectAccount: (email: string, password: string, roleKey: DemoAccount['key']) => void;
  isLoading?: boolean;
  activeRole?: DemoAccount['key'] | null;
}

export function DemoLoginCards({
  onSelectAccount,
  isLoading = false,
  activeRole = null,
}: DemoLoginCardsProps) {
  const { pick } = useI18n();
  const isDemoEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

  if (!isDemoEnabled) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {pick('দ্রুত ডেমো লগইন (১-ক্লিক)', 'Quick Demo Login (1-Click)')}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = account.icon;
          const isThisLoading = isLoading && activeRole === account.key;

          return (
            <button
              key={account.key}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectAccount(account.email, account.password, account.key)}
              className="group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/40 transition-all text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
            >
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${account.accentClass}`}
              >
                {isThisLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {pick(account.labelBn, account.labelEn)}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {pick(account.descBn, account.descEn)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
