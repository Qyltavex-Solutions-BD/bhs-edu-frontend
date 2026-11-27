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

export function PublicTeachersListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const deptFilter = searchParams.get('dept') ?? 'ALL';
  const typeFilter = searchParams.get('type') ?? 'ALL';

  const setFilterParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (!val || val === 'ALL') next.delete(key);
    else next.set(key, val);
    setSearchParams(next, { replace: true });
  };
  const setSearch = (v: string) => setFilterParam('q', v);
  const setDeptFilter = (v: string) => setFilterParam('dept', v);
  const setTypeFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (!v || v === 'ALL') next.delete('type');
    else next.set('type', v);
    next.delete('dept');
    setSearchParams(next, { replace: true });
  };

  const ADMIN_DEPARTMENT_IDS = useMemo(() => new Set(['dept-adm', 'dept-acc', 'dept-lib', 'dept-sec', 'dept-lab']), []);

  const departmentList = useMemo(() => {
    if (!db) return [];
    if (typeFilter === StaffType.TEACHER) {
      return db.departments.filter((d) => !ADMIN_DEPARTMENT_IDS.has(d.id) || d.id === 'dept-adm');
    }
    if (typeFilter === StaffType.OFFICER || typeFilter === StaffType.EMPLOYEE) {
      return db.departments.filter((d) => ADMIN_DEPARTMENT_IDS.has(d.id));
    }
    return db.departments;
  }, [db, typeFilter, ADMIN_DEPARTMENT_IDS]);

  const filtered = useMemo(() => {
    if (!db) return [];
    return db.staff
      .filter((s) => s.status === StaffStatus.ACTIVE)
      .filter((s) => (typeFilter === 'ALL' ? true : s.staffType === typeFilter))
      .filter((s) => (deptFilter === 'ALL' ? true : s.departmentId === deptFilter))
      .filter((s) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q) ||
          (s.qualification ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, search, deptFilter, typeFilter]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={'শিক্ষকমণ্ডলী ও কর্মচারীবৃন্দ'}
        description={'অত্র বিদ্যালয়ের দক্ষ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলী ও প্রশাসনিক কর্মকর্তাবৃন্দ।'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={'নাম বা পদবি খুঁজুন...'}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="ALL">{'সকল বিভাগ'}</option>
          {departmentList.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="ALL">{'সকল ধরন'}</option>
          <option value={StaffType.TEACHER}>{'শিক্ষক'}</option>
          <option value={StaffType.OFFICER}>{'কর্মকর্তা'}</option>
          <option value={StaffType.EMPLOYEE}>{'কর্মচারী'}</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={'কোনো শিক্ষক বা কর্মচারী পাওয়া যায়নি'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((member) => {
            const dept = db.departments.find((d) => d.id === member.departmentId);
            const portraitSrc = getStaffPortrait(member.photo, member.gender, member.id);
            return (
              <Link
                key={member.id}
                href={`/about/teachers/${member.id}`}
                className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
              >
                <div>
                  <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-surface-muted">
                    <img
                      src={portraitSrc}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
                    {dept && (
                      <span className="absolute bottom-2.5 left-3.5 text-sm font-semibold text-white/95">
                        {dept.name}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {member.designation}
                    </p>
                    {member.qualification && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                        <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{member.qualification}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between text-sm font-semibold text-primary">
                  <span>{'বিস্তারিত প্রোফাইল'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

