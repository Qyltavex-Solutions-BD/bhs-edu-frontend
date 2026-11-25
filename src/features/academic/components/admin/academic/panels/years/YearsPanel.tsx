'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateAcademicYearMutation,
  useGetAcademicYearsQuery,
  useRolloverClassSubjectsMutation,
  useSetActiveAcademicYearMutation,
  useUpdateAcademicYearMutation,
} from '@/src/services/academic';
import { Button } from '@/src/components/ui';
import type { AcademicYear } from '@/src/types/entities';
import { errorMessage } from '../shared';
import type { YearFormValues } from '../../academic.schema';
import { YearsTable } from './YearsTable';
import { YearFormModal } from './YearFormModal';

export function YearsPanel({ years }: { years?: AcademicYear[] }) {
  const { data: realYears } = useGetAcademicYearsQuery();
  const yearList = realYears && realYears.length > 0 ? realYears : (years ?? []);

  const [createYear, { isLoading: creating }] = useCreateAcademicYearMutation();
  const [updateYear, { isLoading: updating }] = useUpdateAcademicYearMutation();
  const [setActive, { isLoading: activating }] = useSetActiveAcademicYearMutation();
  const [rolloverSubjects, { isLoading: copying }] = useRolloverClassSubjectsMutation();

  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [open, setOpen] = useState(false);

  const saving = creating || updating || copying;

  const startCreate = () => {
    setEditingYear(null);
    setOpen(true);
  };

  const startEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setOpen(true);
  };

  const close = () => {
    setEditingYear(null);
    setOpen(false);
  };

  const handleSubmit = async (values: YearFormValues, copyFromYearId?: string) => {
    try {
      if (editingYear) {
        await updateYear({
          id: editingYear.id,
          name: values.name.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
          isActive: values.isActive,
        }).unwrap();
        toast.success('শিক্ষাবর্ষ সফলভাবে হালনাগাদ হয়েছে।');
      } else {
        const created = await createYear({
          name: values.name.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
          isActive: values.isActive,
        }).unwrap();

        if (copyFromYearId && created?.id) {
          try {
            const rolloverRes = await rolloverSubjects({
              fromAcademicYearId: copyFromYearId,
              toAcademicYearId: created.id,
            }).unwrap();
            toast.success(
              `নতুন শিক্ষাবর্ষ তৈরি হয়েছে এবং ${rolloverRes.copiedCount}টি বিষয় কপি করা হয়েছে।`,
            );
          } catch {
            toast.success('নতুন শিক্ষাবর্ষ তৈরি হয়েছে (তবে বিষয় কপি করা যায়নি)।');
          }
        } else {
          toast.success('নতুন শিক্ষাবর্ষ সফলভাবে তৈরি হয়েছে।');
        }
      }
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'শিক্ষাবর্ষ সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await setActive({ id }).unwrap();
      toast.success('চলতি শিক্ষাবর্ষ সফলভাবে পরিবর্তন করা হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'চলতি শিক্ষাবর্ষ পরিবর্তন করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" /> নতুন শিক্ষাবর্ষ
        </Button>
      </div>

      <YearsTable
        yearList={yearList}
        activating={activating}
        onActivate={handleActivate}
        onEdit={startEdit}
      />

      <YearFormModal
        open={open}
        editingYear={editingYear}
        existingYears={yearList}
        saving={saving}
        onClose={close}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
