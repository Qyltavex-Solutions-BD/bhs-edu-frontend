'use client';

import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateAcademicYearMutation,
  useGetAcademicYearsQuery,
  useSetActiveAcademicYearMutation,
  useUpdateAcademicYearMutation,
} from '@/src/services/academic';
import { Button, Card, FormField, Input, Modal, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicYear } from '@/src/types/entities';
import { errorMessage } from './shared';
import { useAcademicI18n } from '../academic.i18n';
import { yearSchema, type YearFormValues } from '../academic.schema';

const defaultValues: YearFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  isActive: false,
};

const formatDisplayDate = (d?: string) => {
  if (!d) return '—';
  return d.includes('T') ? d.split('T')[0] : d;
};

export function YearsPanel({ years }: { years?: AcademicYear[] }) {
  const { t, dict } = useAcademicI18n();

  const { data: realYears } = useGetAcademicYearsQuery();
  const yearList = realYears && realYears.length > 0 ? realYears : (years ?? []);

  const [createYear, { isLoading: creating }] = useCreateAcademicYearMutation();
  const [updateYear, { isLoading: updating }] = useUpdateAcademicYearMutation();
  const [setActive, { isLoading: activating }] = useSetActiveAcademicYearMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<YearFormValues>({
    resolver: zodResolver(yearSchema),
    defaultValues,
  });

  const isActive = watch('isActive');
  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const close = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(false);
  };

  const startEdit = (year: AcademicYear) => {
    setEditingId(year.id);
    reset({
      name: year.name,
      startDate: formatDisplayDate(year.startDate),
      endDate: formatDisplayDate(year.endDate),
      isActive: year.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (values: YearFormValues) => {
    try {
      if (editingId) {
        await updateYear({
          id: editingId,
          name: values.name.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.years.updateSuccess));
      } else {
        await createYear({
          name: values.name.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.years.createSuccess));
      }
      close();
    } catch (err) {
      toast.error(errorMessage(err, t(dict.years.saveFailed)));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await setActive({ id }).unwrap();
      toast.success(t(dict.years.activeSuccess));
    } catch (err) {
      toast.error(errorMessage(err, t(dict.years.activeFailed)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" /> {t(dict.years.newYearButton)}
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{t(dict.years.yearColumn)}</th>
              <th className="p-3 text-left">{t(dict.years.datesColumn)}</th>
              <th className="p-3 text-left">{t(dict.common.status)}</th>
              <th className="p-3 text-right">{t(dict.common.actions)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {yearList.map((year) => (
              <tr key={year.id}>
                <td className="p-3 font-semibold tabular-nums">{year.name}</td>
                <td className="p-3 text-muted-foreground tabular-nums">
                  {formatDisplayDate(year.startDate)} — {formatDisplayDate(year.endDate)}
                </td>
                <td className="p-3">
                  <StatusBadge
                    value={year.isActive ? 'ACTIVE' : 'INACTIVE'}
                    customLabel={year.isActive ? t(dict.years.currentBadge) : t(dict.common.inactive)}
                    customTone={year.isActive ? 'success' : 'neutral'}
                  />
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {!year.isActive && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={activating}
                      onClick={() => handleActivate(year.id)}
                    >
                      {t(dict.years.makeCurrent)}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(year)}>
                    <Pencil className="w-4 h-4" />
                    {t(dict.common.edit)}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        open={open}
        onClose={close}
        title={editingId ? t(dict.years.editTitle) : t(dict.years.createTitle)}
        description={t(dict.years.modalDescription)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <FormField label={t(dict.years.nameLabel)} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={t(dict.years.namePlaceholder)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t(dict.years.startsLabel)} required error={errors.startDate?.message}>
              <Input
                type="date"
                {...register('startDate')}
              />
            </FormField>
            <FormField label={t(dict.years.endsLabel)} required error={errors.endDate?.message}>
              <Input
                type="date"
                {...register('endDate')}
              />
            </FormField>
          </div>

          <Switch
            checked={isActive}
            onChange={(val) => setValue('isActive', val)}
            label={t(dict.years.makeCurrentSwitch)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close}>
              {t(dict.common.cancel)}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t(dict.common.saving)
                : editingId
                  ? t(dict.common.update)
                  : t(dict.common.save)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
