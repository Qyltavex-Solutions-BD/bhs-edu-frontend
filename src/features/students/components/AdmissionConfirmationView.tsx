'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Printer, UserPlus, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { triggerPrint } from '@/src/lib/utils/cn';
import { Button, Card } from '@/src/components/ui/primitives';
import { PrintableAdmissionConfirmationSlip } from '@/src/components/print/PrintDocuments';
import {
  getOptionalSubjectsForClassGroup,
  resolvePrimaryGuardianPhone,
  type AdminAdmissionResult,
} from '@/src/features/admission';
import type { MockDatabase } from '@/src/mocks/seed';

export function AdmissionConfirmationView({
  db,
  result,
  onAdmitAnother,
}: {
  db: MockDatabase;
  result: AdminAdmissionResult;
  onAdmitAnother: () => void;
}) {
  const { locale, pick } = useI18n();
  const { student, enrollment, formValues } = result;
  const cls = db.classes.find((c) => c.id === enrollment.classId);
  const sec = db.sections.find((s) => s.id === enrollment.sectionId);
  const grp = db.academicGroups.find((g) => g.id === enrollment.groupId);
  const yr = db.academicYears.find((y) => y.id === enrollment.academicYearId);
  const optionals = enrollment.optionalClassSubjectId
    ? getOptionalSubjectsForClassGroup(db, enrollment.classId, enrollment.groupId, enrollment.academicYearId)
    : [];
  const chosenOpt = optionals.find((o) => o.classSubjectId === enrollment.optionalClassSubjectId);

  return (
    <div className="space-y-5">
      <Card className="p-5 border-success/40 bg-success/5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-base font-bold text-success flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {pick('শিক্ষার্থী সফলভাবে ভর্তি সম্পন্ন হয়েছে!', 'Student Admitted Successfully!')}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {pick('শিক্ষার্থী আইডি:', 'Student ID:')}{' '}
              <strong className="font-mono text-foreground">{student.studentId}</strong> ·{' '}
              {pick('রোল:', 'Roll:')}{' '}
              <strong className="font-mono text-foreground">{enrollment.roll}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" />
              {pick('ভর্তি ও আইডি স্লিপ প্রিন্ট', 'Print Confirmation & ID Slip')}
            </Button>
            <Link href={`/admin/students/${student.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {pick('প্রোফাইল দেখুন', 'View Profile')}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onAdmitAnother}>
              <UserPlus className="w-4 h-4" />
              {pick('আরও একজন ভর্তি করুন', 'Admit Another')}
            </Button>
          </div>
        </div>
      </Card>

      <PrintableAdmissionConfirmationSlip
        school={db.schoolProfile}
        student={student}
        enrollment={enrollment}
        classNameLabel={cls ? (locale === 'bn' ? cls.nameBn || cls.name : cls.name) : ''}
        sectionName={sec?.name ?? ''}
        groupName={grp ? (locale === 'bn' ? grp.nameBn || grp.name : grp.name) : null}
        academicYearName={yr?.name ?? ''}
        fatherName={formValues.fatherNameBn}
        motherName={formValues.motherNameBn}
        guardianPhone={resolvePrimaryGuardianPhone(formValues)}
        optionalSubjectName={chosenOpt ? (locale === 'bn' ? chosenOpt.nameBn : chosenOpt.nameEn) : null}
      />
    </div>
  );
}
