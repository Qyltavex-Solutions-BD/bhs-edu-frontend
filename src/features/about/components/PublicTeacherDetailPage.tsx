'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import {
  EmptyState,
  getCampusPhoto,
  getCommitteePortrait,
  getLeadershipPortrait,
  getStaffPortrait,
  InstitutionalArtwork,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { InstitutionContentType, StaffStatus, StaffType } from '@/src/types/enums';
import { triggerPrint } from '@/src/lib/utils/cn';

export function PublicTeacherDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const teacher = db.staff.find((s) => s.id === id);
  if (!teacher) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          title={'শিক্ষকের তথ্য পাওয়া যায়নি'}
          action={
            <Link href="/about/teachers">
              <Button variant="outline">{'তালিকায় ফিরুন'}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const dept = db.departments.find((d) => d.id === teacher.departmentId);
  const assignments = db.teacherAssignments.filter((ta) => ta.staffId === teacher.id && ta.isActive);
  const portraitSrc = getStaffPortrait(teacher.photo, teacher.gender, teacher.id);
  const otherTeachers = db.staff
    .filter((s) => s.status === StaffStatus.ACTIVE && s.staffType === StaffType.TEACHER && s.id !== teacher.id)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/about/teachers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {'শিক্ষকমণ্ডলীর তালিকায় ফিরুন'}
        </Link>
        <span className="text-sm text-muted-foreground tabular-nums">
          {db.schoolProfile.name}
        </span>
      </div>

      {/* Editorial Portrait Profile Card */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-4 bg-surface-muted min-h-[300px] sm:min-h-[340px]">
            <img
              src={portraitSrc}
              alt={teacher.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {dept && <span className="font-semibold text-primary">{dept.name}</span>}
                {dept && <span aria-hidden="true">·</span>}
                <span>{db.schoolProfile.name}</span>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {teacher.name}
                </h1>
                <p className="text-base font-medium text-primary">
                  {teacher.designation}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
                {teacher.qualification && (
                  <div>
                    <p className="text-sm text-muted-foreground">{'শিক্ষাগত যোগ্যতা'}</p>
                    <p className="font-semibold text-foreground mt-0.5">{teacher.qualification}</p>
                  </div>
                )}
                {teacher.joiningDate && (
                  <div className="tabular-nums">
                    <p className="text-sm text-muted-foreground">{'যোগদানের তারিখ'}</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDateLong(teacher.joiningDate, 'bn')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Public-safe contact details */}
            <div className="pt-4 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {teacher.email && (
                <a
                  href={`mailto:${teacher.email}`}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{teacher.email}</span>
                </a>
              )}
              {teacher.phone && (
                <a
                  href={`tel:${teacher.phone}`}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{teacher.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Assigned Classes & Subjects */}
      {assignments.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {'বর্তমান পাঠদানকৃত শ্রেণি ও বিষয়'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignments.map((a) => {
              const cls = db.classes.find((c) => c.id === a.classId);
              const sec = db.sections.find((s) => s.id === a.sectionId);
              const cs = db.classSubjects.find((x) => x.id === a.classSubjectId);
              const sub = cs ? db.subjects.find((s) => s.id === cs.subjectId) : null;
              return (
                <div key={a.id} className="p-3.5 border border-border rounded-xl bg-surface-muted/40 text-sm">
                  <p className="font-semibold text-foreground text-base">
                    {sub?.nameBn ?? sub?.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {cls?.nameBn} — {'শাখা'} {sec?.name}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Other Faculty Members Strip */}
      {otherTeachers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {'অন্যান্য শিক্ষকমণ্ডলী'}
            </h2>
            <Link href="/about/teachers" className="text-sm font-semibold text-primary hover:underline">
              {'সকল শিক্ষক দেখুন'}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherTeachers.map((other) => (
              <Link
                key={other.id}
                href={`/about/teachers/${other.id}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-primary/45 transition-colors"
              >
                <img
                  src={getStaffPortrait(other.photo, other.gender, other.id)}
                  alt={other.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-14 rounded-lg object-cover object-top border border-border shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {other.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {other.designation}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

