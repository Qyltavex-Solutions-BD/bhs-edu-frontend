'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Bell,
  ShieldCheck,
  Check,
  X,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import type { Notice, AuditLog } from '@/src/types/entities';

const COLOR_CORAL = '#DF6153';
const TINT_CORAL = '#F4DAD5';

export interface DashboardPendingAction {
  id: string;
  avatar: string;
  avatarBg: string;
  avatarText: string;
  title: string;
  subtitle: string;
  link: string;
}

interface AdminDashboardWidgetsProps {
  pendingActions: DashboardPendingAction[];
  onDismissAction: (id: string) => void;
  notices: Notice[];
  noticesLoading?: boolean;
  auditLogs: AuditLog[];
  locale: 'bn' | 'en';
  pick: (bn: string, en: string) => string;
}

export function AdminDashboardWidgets({
  pendingActions,
  onDismissAction,
  notices,
  noticesLoading = false,
  auditLogs,
  locale,
  pick,
}: AdminDashboardWidgetsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Widget 1: Pending Actions */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#1C6440]" />
              {pick('অপেক্ষমাণ কাজ ও অনুমোদন', 'Pending Actions')}
            </h3>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
              style={{ backgroundColor: TINT_CORAL, color: COLOR_CORAL }}
            >
              {formatNumber(pendingActions.length, locale)} {pick('কাজ', 'pending')}
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {pendingActions.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-surface-muted/30 transition-colors rounded-xl px-1"
              >
                <Link href={item.link} className="flex items-center gap-3 min-w-0 flex-1 group">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ backgroundColor: item.avatarBg, color: item.avatarText }}
                  >
                    {item.avatar}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDismissAction(item.id)}
                    title={pick('বাতিল', 'Dismiss')}
                    className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-[#DF6153] hover:bg-[#F4DAD5]/40 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <Link href={item.link}>
                    <button
                      type="button"
                      title={pick('দেখুন', 'Open')}
                      className="w-8 h-8 rounded-full bg-[#1C6440] hover:bg-[#154E31] text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3.5 border-t border-border mt-3">
          <Link
            href="/admin/students/admissions"
            className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
          >
            <span>{pick('সকল অপেক্ষমাণ আবেদন পর্যালোচনা', 'Manage all pending actions')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Widget 2: Recent Notices */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1C6440]" />
              {pick('সাম্প্রতিক নোটিশ', 'Recent Notices')}
            </h3>
            <Link
              href="/admin/notices"
              className="text-sm font-semibold text-[#1C6440] hover:underline"
            >
              {pick('সব দেখুন', 'Manage')}
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {noticesLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-3 animate-pulse">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-3/4 rounded bg-surface-muted" />
                    <div className="h-3 w-24 rounded bg-surface-muted" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-surface-muted shrink-0" />
                </div>
              ))
            ) : notices.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {pick('এখনো কোনো নোটিশ প্রকাশ করা হয়নি।', 'No notices published yet.')}
              </div>
            ) : (
              notices.slice(0, 5).map((n) => (
                <div key={n.id} className="py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                      {formatDateShort(n.createdAt, (locale === 'bn' ? 'bn' : 'en'))}
                    </p>
                  </div>
                  <StatusBadge enumName="NoticeStatus" value={n.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3.5 border-t border-border mt-3">
          <Link
            href="/admin/notices"
            className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
          >
            <span>{pick('নতুন নোটিশ তৈরি করুন', 'Create New Notice')}</span>
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Widget 3: Recent Activity Log */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1C6440]" />
              {pick('সাম্প্রতিক অডিট লগ', 'Recent Activity Log')}
            </h3>
            <Link
              href="/admin/audit-logs"
              className="text-sm font-semibold text-[#1C6440] hover:underline"
            >
              {pick('সম্পূর্ণ লগ', 'Full Log')}
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="py-3 text-base">
                <p className="font-semibold text-foreground truncate text-base">
                  {log.action} · <span className="text-[#1C6440]">{log.module}</span>
                </p>
                <p className="text-muted-foreground line-clamp-1 text-sm mt-0.5">{log.details}</p>
                <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                  {formatDateShort(log.createdAt, (locale === 'bn' ? 'bn' : 'en'))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3.5 border-t border-border mt-3">
          <Link
            href="/admin/audit-logs"
            className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
          >
            <span>{pick('অডিট ইতিহাস পরীক্ষা করুন', 'Inspect Audit History')}</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
