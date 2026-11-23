'use client';

import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSaveAcademicYearMutation,
  useSetActiveAcademicYearMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Modal, Switch } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicYear } from '@/src/types/entities';
import { errorMessage } from './shared';

const emptyYear = { name: '', startDate: '', endDate: '', isActive: false };

export function YearsPanel({ years }: { years: AcademicYear[] }) {
  const { pick } = useI18n();
  const [saveYear, { isLoading: saving }] = useSaveAcademicYearMutation();
  const [setActive, { isLoading: activating }] = useSetActiveAcademicYearMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyYear);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyYear);
    setOpen(true);
  };

  const close = () => {
    setEditingId(null);
    setForm(emptyYear);
    setOpen(false);
  };

  const startEdit = (year: AcademicYear) => {
    setEditingId(year.id);
    setForm({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      isActive: year.isActive,
    });
    setOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveYear({
        id: editingId ?? undefined,
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      }).unwrap();
      toast.success(
        editingId
          ? pick('শিক্ষাবর্ষ হালনাগাদ হয়েছে।', 'Academic year updated.')
          : pick('নতুন শিক্ষাবর্ষ যুক্ত হয়েছে।', 'Academic year created.')
      );
      close();
    } catch (err) {
      toast.error(errorMessage(err, pick('শিক্ষাবর্ষ সংরক্ষণ হয়নি।', 'Could not save the academic year.')));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await setActive({ id }).unwrap();
      toast.success(pick('এই বছরটি এখন সক্রিয় শিক্ষাবর্ষ।', 'This year is now the active academic year.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('সক্রিয় করা যায়নি।', 'Could not activate the year.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" /> {pick('নতুন শিক্ষাবর্ষ', 'New academic year')}
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শিক্ষাবর্ষ', 'Year')}</th>
              <th className="p-3 text-left">{pick('সময়কাল', 'Dates')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {years.map((year) => (
              <tr key={year.id}>
                <td className="p-3 font-semibold tabular-nums">{year.name}</td>
                <td className="p-3 text-muted-foreground tabular-nums">
                  {year.startDate} — {year.endDate}
                </td>
                <td className="p-3">
                  <StatusBadge
                    value={year.isActive ? 'ACTIVE' : 'INACTIVE'}
                    customLabel={year.isActive ? pick('চলতি', 'Current') : pick('বন্ধ', 'Inactive')}
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
                      {pick('চলতি করুন', 'Make current')}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(year)}>
                    <Pencil className="w-4 h-4" />
                    {pick('সম্পাদনা', 'Edit')}
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
        title={
          editingId
            ? pick('শিক্ষাবর্ষ সম্পাদনা', 'Edit academic year')
            : pick('নতুন শিক্ষাবর্ষ', 'New academic year')
        }
        description={pick(
          'শুরুর তারিখ শেষ তারিখের আগে হতে হবে। একটি বছর চলতি থাকবে।',
          'The start date must be before the end date. One year stays current.'
        )}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('নাম', 'Name')}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="2027"
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={pick('শুরু', 'Starts')}>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                required
              />
            </FormField>
            <FormField label={pick('শেষ', 'Ends')}>
              <Input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                required
              />
            </FormField>
          </div>
          <Switch
            checked={form.isActive}
            onChange={(isActive) => setForm({ ...form, isActive })}
            label={pick('এটিকে চলতি শিক্ষাবর্ষ করুন', 'Make this the current year')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
