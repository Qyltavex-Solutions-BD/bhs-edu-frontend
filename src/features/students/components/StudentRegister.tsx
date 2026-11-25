'use client';

import React, { useMemo, useState } from 'react';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import {
  type AdmissionCatalogData,
  type AdminAdmissionResult,
  UnifiedAdmissionForm,
} from '@/src/features/admission';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import { useGetClassSubjectsQuery } from '@/src/services/academic/class-subject.api';
import { AdmissionConfirmationView } from './AdmissionConfirmationView';
import type { MockDatabase } from '@/src/mocks/seed';

export function StudentRegister({
  db,
  yearId,
}: {
  db?: MockDatabase;
  yearId?: string;
}) {
  const [admitted, setAdmitted] = useState<AdminAdmissionResult | null>(null);

  const { data: academicYears = [], isLoading: loadingYears } =
    useGetAcademicYearsQuery();
  const { data: classes = [], isLoading: loadingClasses } =
    useGetSchoolClassesQuery({ isActive: true });
  const { data: sections = [], isLoading: loadingSections } =
    useGetSectionsQuery({ isActive: true });
  const { data: academicGroups = [], isLoading: loadingGroups } =
    useGetAcademicGroupsQuery();
  const { data: classSubjects = [], isLoading: loadingClassSubjects } =
    useGetClassSubjectsQuery({ isActive: true });

  const resolvedYearId = useMemo(
    () =>
      yearId ||
      academicYears.find((y) => y.isActive)?.id ||
      academicYears[0]?.id ||
      '',
    [yearId, academicYears]
  );

  const liveCatalog: AdmissionCatalogData = useMemo(
    () => ({
      academicYears,
      classes,
      sections,
      academicGroups,
      classSubjects,
      schoolProfile: db?.schoolProfile,
      admissionContent: db?.admissionContent,
    }),
    [
      academicYears,
      classes,
      sections,
      academicGroups,
      classSubjects,
      db?.schoolProfile,
      db?.admissionContent,
    ]
  );

  if (
    loadingYears ||
    loadingClasses ||
    loadingSections ||
    loadingGroups ||
    loadingClassSubjects
  ) {
    return <LoadingSkeleton />;
  }

  if (admitted) {
    return (
      <AdmissionConfirmationView
        db={liveCatalog}
        result={admitted}
        onAdmitAnother={() => setAdmitted(null)}
      />
    );
  }

  return (
    <UnifiedAdmissionForm
      mode="admin"
      db={liveCatalog}
      yearId={resolvedYearId}
      onAdminSuccess={(result) => setAdmitted(result)}
    />
  );
}
