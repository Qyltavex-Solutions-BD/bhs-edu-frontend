'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, User } from 'lucide-react';
import { useParams } from '@/src/lib/navigation';
import { useGetStudentByIdQuery } from '@/src/features/students/api/students.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card } from '@/src/components/ui/primitives';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';

import type { Student } from '@/src/types/entities';

interface StudentDetailWithRelations extends Student {
  enrollments?: Array<{
    id: string;
    roll: number;
    status: string;
    schoolClass?: { id: string; name: string; nameBn?: string | null };
    section?: { id: string; name: string };
    group?: { id: string; name: string; nameBn?: string | null } | null;
    academicYear?: { id: string; name: string };
  }>;
  rfidcards?: Array<{
    id: string;
    cardNumber: string;
    status: string;
  }>;
  parents?: Array<{
    id: string;
    relationship: string;
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      nameBn?: string | null;
      phone?: string | null;
    };
  }>;
}

export function ParentChildDetailPage() {
  const { id } = useParams();
  const studentId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] ?? '' : '';

  const { data: rawStudent, isLoading } = useGetStudentByIdQuery(studentId, {
    skip: !studentId,
  });
  const student = rawStudent as StudentDetailWithRelations | undefined;

  if (isLoading) return <LoadingSkeleton />;

  if (!student) {
    return (
      <EmptyState
        title={'শিক্ষার্থীর তথ্য পাওয়া যায়নি'}
        description={'অনুগ্রহ করে আমার সন্তান তালিকা থেকে আবার নির্বাচন করুন।'}
        action={
          <Link href="/parent/children">
            <Button variant="primary" size="sm">
              {'সকল সন্তান'}
            </Button>
          </Link>
        }
      />
    );
  }

  const activeEnrollment =
    student.enrollments?.find((e) => e.status === 'ACTIVE') ?? student.enrollments?.[0];
  const className =
    activeEnrollment?.schoolClass?.nameBn || activeEnrollment?.schoolClass?.name || '—';
  const sectionName = activeEnrollment?.section?.name;
  const groupName = activeEnrollment?.group?.nameBn || activeEnrollment?.group?.name;
  const yearName = activeEnrollment?.academicYear?.name || '—';
  const activeRfid = student.rfidcards?.find((r) => r.status === 'ACTIVE') ?? student.rfidcards?.[0];

  const genderLabel =
    (ENUM_LABELS.Gender as Record<string, { bn: string }> | undefined)?.[student.gender]?.bn ??
    student.gender;
  const religionLabel = student.religion
    ? ((ENUM_LABELS.Religion as Record<string, { bn: string }> | undefined)?.[student.religion]
        ?.bn ?? student.religion)
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.nameBn || student.nameEn}
        description={`${className}${sectionName ? ` (${sectionName})` : ''} · ID: ${student.studentId}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge enumName="StudentStatus" value={student.status} />
            <Link href="/parent/children">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
                {'সকল সন্তান'}
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.nameBn || student.nameEn}
              className="w-16 h-16 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="w-8 h-8" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {student.nameBn || student.nameEn}
            </h2>
            <p className="text-sm text-muted-foreground">{student.nameEn}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-base">
          <div>
            <p className="text-sm text-muted-foreground">{'রোল নম্বর'}</p>
            <p className="font-bold tabular-nums mt-0.5 text-lg">
              {activeEnrollment?.roll != null ? formatNumber(activeEnrollment.roll, 'bn') : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'শ্রেণি ও শাখা'}</p>
            <p className="font-semibold mt-0.5">
              {className}
              {sectionName ? ` (${sectionName})` : ''}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'বিভাগ'}</p>
            <p className="font-semibold mt-0.5">{groupName || 'সাধারণ'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'শিক্ষাবর্ষ'}</p>
            <p className="tabular-nums font-semibold mt-0.5">{yearName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'জন্ম তারিখ'}</p>
            <p className="tabular-nums mt-0.5">
              {student.dateOfBirth ? formatDateLong(student.dateOfBirth, 'bn') : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'রক্তের গ্রুপ'}</p>
            <p className="font-semibold mt-0.5">{student.bloodGroup ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'লিঙ্গ ও ধর্ম'}</p>
            <p className="mt-0.5">
              {genderLabel} · {religionLabel}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'RFID কার্ড নম্বর'}</p>
            <p className="font-mono mt-0.5">{activeRfid?.cardNumber ?? 'ইস্যু করা হয়নি'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'বর্তমান ঠিকানা'}</p>
            <p className="mt-0.5">
              {student.presentAddress ?? student.permanentAddress ?? '—'}
            </p>
          </div>
        </div>

        {student.parents && student.parents.length > 0 && (
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              {'অভিভাবকদের তথ্য'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {student.parents.map((link) => {
                const relLabel =
                  (ENUM_LABELS.RelationshipType as Record<string, { bn: string }> | undefined)?.[
                    link.relationship
                  ]?.bn ?? link.relationship;
                return (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {link.parent.nameBn || link.parent.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {relLabel}
                        {link.isPrimary ? ' · প্রাথমিক অভিভাবক' : ''}
                      </div>
                    </div>
                    {link.parent.phone && (
                      <a
                        href={`tel:${link.parent.phone}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {link.parent.phone}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
