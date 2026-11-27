'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Printer, UserPlus, CheckCircle2 } from 'lucide-react';
import { triggerPrint } from '@/src/lib/utils/cn';
import { Button, Card } from '@/src/components/ui/primitives';
import { PrintableAdmissionConfirmationSlip } from '@/src/components/print/PrintDocuments';
import {
  type AdmissionCatalogData,
  getOptionalSubjectsForClassGroup,
  resolvePrimaryGuardianPhone,
  type AdminAdmissionResult,
} from '@/src/features/admission';
import type { SchoolProfile } from '@/src/types/entities';

export function AdmissionConfirmationView({
  db,
  result,
  onAdmitAnother,
}: {
  db: AdmissionCatalogData;
  result: AdminAdmissionResult;
  onAdmitAnother: () => void;
}) {
  const { student, enrollment, formValues } = result;
  const enrolledAny = enrollment as unknown as {
    schoolClass?: { name: string; nameBn?: string };
    section?: { name: string };
    group?: { name: string; nameBn?: string } | null;
    academicYear?: { name: string };
    optionalClassSubject?: {
      subject?: { name: string; nameBn?: string; officialCode?: string | null };
    } | null;
  };
  const cls = db.classes.find((c) => c.id === enrollment.classId) ?? enrolledAny.schoolClass;
  const sec = db.sections.find((s) => s.id === enrollment.sectionId) ?? enrolledAny.section;
  const grp = db.academicGroups.find((g) => g.id === enrollment.groupId) ?? enrolledAny.group;
  const yr = db.academicYears.find((y) => y.id === enrollment.academicYearId) ?? enrolledAny.academicYear;
  const optionals = enrollment.optionalClassSubjectId
    ? getOptionalSubjectsForClassGroup(db, enrollment.classId, enrollment.groupId, enrollment.academicYearId)
    : [];
  const chosenOpt = optionals.find((o) => o.classSubjectId === enrollment.optionalClassSubjectId);
  const optionalSubjectName = chosenOpt
    ? chosenOpt.nameBn
    : enrolledAny.optionalClassSubject?.subject
    ? enrolledAny.optionalClassSubject.subject.nameBn || enrolledAny.optionalClassSubject.subject.name
    : null;
  const school: SchoolProfile =
    db.schoolProfile ??
    ({
      id: 'default',
      name: 'Bhojeshwar High School',
      nameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
      nameEn: 'Bhojeshwar High School',
      eiin: '113587',
      address: 'নড়িয়া, শরীয়তপুর',
      createdAt: '',
      updatedAt: '',
    } as SchoolProfile);

  return (
    <div className="space-y-5">
      <Card className="p-5 border-success/40 bg-success/5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-base font-bold text-success flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {'শিক্ষার্থী সফলভাবে ভর্তি সম্পন্ন হয়েছে!'}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {'শিক্ষার্থী আইডি:'}{' '}
              <strong className="font-mono text-foreground">{student.studentId}</strong> ·{' '}
              {'রোল:'}{' '}
              <strong className="font-mono text-foreground">{enrollment.roll}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" />
              {'ভর্তি ও আইডি স্লিপ প্রিন্ট'}
            </Button>
            <Link href={`/admin/students/${student.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {'প্রোফাইল দেখুন'}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onAdmitAnother}>
              <UserPlus className="w-4 h-4" />
              {'আরও একজন ভর্তি করুন'}
            </Button>
          </div>
        </div>
      </Card>

      <PrintableAdmissionConfirmationSlip
        school={school}
        student={student}
        enrollment={enrollment}
        classNameLabel={cls ? (cls.nameBn || cls.name) : ''}
        sectionName={sec?.name ?? ''}
        groupName={grp ? (grp.nameBn || grp.name) : null}
        academicYearName={yr?.name ?? ''}
        fatherName={formValues.fatherNameBn}
        motherName={formValues.motherNameBn}
        guardianPhone={resolvePrimaryGuardianPhone(formValues)}
        optionalSubjectName={optionalSubjectName}
      />
    </div>
  );
}
