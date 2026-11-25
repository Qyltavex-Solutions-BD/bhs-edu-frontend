'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormField, Input, Modal, Switch } from '@/src/components/ui';
import type { AcademicYear } from '@/src/types/entities';
import { yearSchema, type YearFormValues } from '../../academic.schema';

const defaultValues: YearFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  isActive: false,
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const toBanglaDigitsOnly = (val: string) =>
  val
    .replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
    .replace(/[^\u09E6-\u09EF]/g, '')
    .slice(0, 4);

const toEnglishDigits = (val: string) =>
  val.replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09e6));

const formatInputDate = (d?: string) => {
  if (!d) return '';
  return d.includes('T') ? d.split('T')[0] : d;
};

interface YearFormModalProps {
  open: boolean;
  editingYear: AcademicYear | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: YearFormValues) => Promise<void>;
}

export function YearFormModal({
  open,
  editingYear,
  saving,
  onClose,
  onSubmit,
}: YearFormModalProps) {
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
  const watchedName = watch('name');

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      return;
    }
    if (editingYear) {
      reset({
        name: toBanglaDigitsOnly(editingYear.name),
        startDate: formatInputDate(editingYear.startDate),
        endDate: formatInputDate(editingYear.endDate),
        isActive: editingYear.isActive,
      });
    } else {
      reset(defaultValues);
    }
  }, [open, editingYear, reset]);

  // Auto-fill 1 Jan - 31 Dec when typing a 4-digit Bangla year in create mode
  useEffect(() => {
    if (!open || editingYear) return;
    const match = watchedName?.trim().match(/^২০[০-৯]{2}$/);
    if (match) {
      const y = toEnglishDigits(match[0]);
      setValue('startDate', `${y}-01-01`);
      setValue('endDate', `${y}-12-31`);
    }
  }, [watchedName, open, editingYear, setValue]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingYear ? 'শিক্ষাবর্ষ সম্পাদনা করুন' : 'নতুন শিক্ষাবর্ষ তৈরি করুন'}
      description="মাধ্যমিক স্কুলের শিক্ষাবর্ষ সাধারণত ১ জানুয়ারি থেকে ৩১ ডিসেম্বর পর্যন্ত একক ক্যালেন্ডার বছর হয়।"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="শিক্ষাবর্ষ (বাংলা সাল)" required error={errors.name?.message}>
          <Input
            inputMode="numeric"
            maxLength={4}
            value={watchedName ?? ''}
            onChange={(e) => {
              const cleaned = toBanglaDigitsOnly(e.target.value);
              setValue('name', cleaned, { shouldValidate: true });
            }}
            placeholder="যেমন: ২০২৭"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="শুরুর তারিখ" required error={errors.startDate?.message}>
            <Input type="date" {...register('startDate')} />
          </FormField>
          <FormField label="শেষের তারিখ" required error={errors.endDate?.message}>
            <Input type="date" {...register('endDate')} />
          </FormField>
        </div>

        <Switch
          checked={isActive}
          onChange={(val) => setValue('isActive', val)}
          label="এই শিক্ষাবর্ষকে চলতি (Active) হিসেবে সেট করুন"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving
              ? 'সংরক্ষণ হচ্ছে...'
              : editingYear
                ? 'আপডেট করুন'
                : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
