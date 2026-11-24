'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { Department, Staff } from '@/src/types/entities';
import { StaffStatus, StaffType } from '@/src/types/enums';
import { useI18n } from '@/src/lib/i18n';
import { getStaffPortrait } from '@/src/components/shared/Feedback';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeFacultySectionProps {
  staff: Staff[];
  departments: Department[];
}

export function HomeFacultySection({ staff, departments }: HomeFacultySectionProps) {
  const { pick } = useI18n();

  const teachersPreview = (staff ?? [])
    .filter((s) => s.staffType === StaffType.TEACHER && s.status === StaffStatus.ACTIVE)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">
            {pick('একাডেমিক শিক্ষকমণ্ডলী', 'Academic Faculty')}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {pick('অভিজ্ঞ শিক্ষকমণ্ডলী', 'Faculty & Teachers')}
          </h2>
          <p className="text-base text-muted-foreground mt-1">
            {pick(
              'বিষয়ভিত্তিক দক্ষ, নিবেদিতপ্রাণ ও অভিজ্ঞ শিক্ষকমণ্ডলীর তত্ত্বাবধানে পাঠদান।',
              'Dedicated subject specialists mentoring Classes 6–10 across all streams.'
            )}
          </p>
        </div>
        <Link
          href="/about/teachers"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
        >
          <span>{pick('সকল শিক্ষক দেখুন', 'View All Teachers')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {teachersPreview.map((teacher) => {
          const dept = (departments ?? []).find((d) => d.id === teacher.departmentId);
          const portraitSrc = getStaffPortrait(teacher.photo, teacher.gender, teacher.id);
          return (
            <Link
              key={teacher.id}
              href={`/about/teachers/${teacher.id}`}
              className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
            >
              <div>
                <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-surface-muted">
                  <img
                    src={portraitSrc}
                    alt={teacher.name}
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

                <div className="p-4 space-y-1">
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {teacher.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {teacher.designation}
                  </p>
                  {teacher.qualification && (
                    <p className="text-sm text-muted-foreground pt-0.5">
                      {teacher.qualification}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 pb-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between text-sm font-semibold text-primary">
                <span>{pick('প্রোফাইল দেখুন', 'View Profile')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
