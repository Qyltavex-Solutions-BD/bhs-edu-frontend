'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { useRemoveAcademicEventMutation, useSaveAcademicEventMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicEvent, AcademicYear } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { AcademicEventType } from '@/src/types/enums';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

const EMPTY = {
  id: '',
  title: '',
  description: '',
  eventType: AcademicEventType.HOLIDAY,
  startDate: '',
  endDate: '',
};

export function AcademicCalendar({ db, year }: { db: MockDatabase; year: AcademicYear }) {
  const { locale, pick } = useI18n();
  const [saveEvent, { isLoading: saving }] = useSaveAcademicEventMutation();
  const [removeEvent, { isLoading: removing }] = useRemoveAcademicEventMutation();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const events = useMemo(
    () =>
      db.academicEvents
        .filter((item) => item.academicYearId === year.id)
        .slice()
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title)),
    [db.academicEvents, year.id]
  );

  const fill = (event: AcademicEvent) => {
    setForm({
      id: event.id,
      title: event.title,
      description: event.description ?? '',
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveEvent({
        id: form.id || undefined,
        academicYearId: year.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        eventType: form.eventType,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
      }).unwrap();
      toast.success(
        form.id
          ? pick('ইভেন্ট আপডেট হয়েছে।', 'Event updated.')
          : pick('ইভেন্ট যোগ হয়েছে।', 'Event added.')
      );
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('ইভেন্ট সংরক্ষণ হয়নি।', 'Could not save the event.')));
    }
  };

  const onRemove = async (id: string) => {
    try {
      await removeEvent({ id }).unwrap();
      if (form.id === id) setForm(EMPTY);
      toast.success(pick('ইভেন্ট মুছে ফেলা হয়েছে।', 'Event removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('ইভেন্ট মোছা যায়নি।', 'Could not remove the event.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          {pick('ছুটি বা ইভেন্ট', 'Add date')}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? pick('ইভেন্ট সম্পাদনা', 'Edit event') : pick('ছুটি বা ইভেন্ট', 'Holiday or event')}
        description={pick('তারিখ এই শিক্ষাবর্ষের ক্যালেন্ডারে যায়।', 'The date is stored on this academic year.')}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={pick('ধরন', 'Type')}>
            <Select
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value as AcademicEventType })}
            >
              <option value={AcademicEventType.HOLIDAY}>{pick('ছুটি', 'Holiday')}</option>
              <option value={AcademicEventType.EVENT}>{pick('অনুষ্ঠান', 'Event')}</option>
              <option value={AcademicEventType.ADMISSION}>{pick('ভর্তি', 'Admission')}</option>
              <option value={AcademicEventType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
            </Select>
          </FormField>
          <FormField label={pick('শিরোনাম', 'Title')}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </FormField>
          <FormField label={pick('শুরু', 'Start')}>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </FormField>
          <FormField label={pick('শেষ', 'End')}>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={pick('বিবরণ', 'Description')}>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {form.id ? pick('আপডেট', 'Update') : pick('যোগ করুন', 'Add')}
            </Button>
          </div>
        </form>
      </Modal>

      <Card className="overflow-x-auto">
        <div className="p-5 pb-3 border-b border-border">
          <h3 className="text-base font-bold text-foreground">{pick('এই শিক্ষাবর্ষের ক্যালেন্ডার', 'Calendar for this year')}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 text-left">{pick('তারিখ', 'Dates')}</th>
              <th className="p-3 text-left">{pick('ধরন', 'Type')}</th>
              <th className="p-3 text-left">{pick('শিরোনাম', 'Title')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-muted-foreground">
                  {pick('এই শিক্ষাবর্ষে এখনো কোনো ইভেন্ট নেই।', 'No events for this academic year yet.')}
                </td>
              </tr>
            )}
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-surface-muted/30">
                <td className="p-3 whitespace-nowrap tabular-nums text-muted-foreground">
                  {formatDateShort(event.startDate, locale)}
                  {event.endDate !== event.startDate ? ` – ${formatDateShort(event.endDate, locale)}` : ''}
                </td>
                <td className="p-3">
                  <StatusBadge enumName="AcademicEventType" value={event.eventType} />
                </td>
                <td className="p-3">
                  <p className="font-semibold text-foreground">{event.title}</p>
                  {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button type="button" variant="ghost" size="sm" onClick={() => fill(event)}>
                    <Pencil className="w-4 h-4" />
                    {pick('সম্পাদনা', 'Edit')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={removing} onClick={() => onRemove(event.id)}>
                    <Trash2 className="w-4 h-4" />
                    {pick('মুছুন', 'Remove')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
