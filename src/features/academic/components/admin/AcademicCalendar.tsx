'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import {
  useCreateAcademicEventMutation,
  useDeleteAcademicEventMutation,
  useGetAcademicEventsQuery,
  useUpdateAcademicEventMutation,
} from '@/src/services/academic';
import { formatDateShort } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicEvent, AcademicYear } from '@/src/types/entities';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val?: string) => Boolean(val && UUID_REGEX.test(val));

export function AcademicCalendar({ year }: { year: AcademicYear }) {
  const { data: realEvents } = useGetAcademicEventsQuery(
    isUuid(year?.id) ? { academicYearId: year.id } : undefined,
    { skip: !isUuid(year?.id) }
  );
  const [createEvent, { isLoading: creating }] = useCreateAcademicEventMutation();
  const [updateEvent, { isLoading: updating }] = useUpdateAcademicEventMutation();
  const [deleteEvent, { isLoading: removing }] = useDeleteAcademicEventMutation();
  const saving = creating || updating;
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const events = useMemo(() => {
    return (realEvents ?? [])
      .slice()
      .sort(
        (a, b) =>
          String(a.startDate).localeCompare(String(b.startDate)) ||
          a.title.localeCompare(b.title)
      );
  }, [realEvents]);

  const fill = (event: AcademicEvent) => {
    setForm({
      id: event.id,
      title: event.title,
      description: event.description ?? '',
      eventType: event.eventType,
      startDate: String(event.startDate).slice(0, 10),
      endDate: String(event.endDate).slice(0, 10),
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) {
        await updateEvent({
          id: form.id,
          academicYearId: year.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventType: form.eventType,
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
        }).unwrap();
      } else {
        await createEvent({
          academicYearId: year.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventType: form.eventType,
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
        }).unwrap();
      }
      toast.success(
        form.id
          ? 'ইভেন্ট আপডেট হয়েছে।'
          : 'ইভেন্ট যোগ হয়েছে।'
      );
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'ইভেন্ট সংরক্ষণ হয়নি।'));
    }
  };

  const onRemove = async (id: string) => {
    try {
      await deleteEvent(id).unwrap();
      if (form.id === id) setForm(EMPTY);
      toast.success('ইভেন্ট মুছে ফেলা হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'ইভেন্ট মোছা যায়নি।'));
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
          {'ছুটি বা ইভেন্ট'}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ইভেন্ট সম্পাদনা' : 'ছুটি বা ইভেন্ট'}
        description={'তারিখ এই শিক্ষাবর্ষের ক্যালেন্ডারে যায়।'}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={'ধরন'}>
            <Select
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value as AcademicEventType })}
            >
              <option value={AcademicEventType.HOLIDAY}>{'ছুটি'}</option>
              <option value={AcademicEventType.EVENT}>{'অনুষ্ঠান'}</option>
              <option value={AcademicEventType.ADMISSION}>{'ভর্তি'}</option>
              <option value={AcademicEventType.OTHER}>{'অন্যান্য'}</option>
            </Select>
          </FormField>
          <FormField label={'শিরোনাম'}>
            <Input placeholder="শিরোনাম লিখুন" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </FormField>
          <FormField label={'শুরু'}>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </FormField>
          <FormField label={'শেষ'}>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={'বিবরণ'}>
              <Textarea placeholder="বিবরণ লিখুন..." rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{'বাতিল'}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {form.id ? 'আপডেট' : 'যোগ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      <Card className="overflow-x-auto">
        <div className="p-5 pb-3 border-b border-border">
          <h3 className="text-base font-bold text-foreground">{'এই শিক্ষাবর্ষের ক্যালেন্ডার'}</h3>
        </div>
        <table className="w-full text-base">
          <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 text-left">{'তারিখ'}</th>
              <th className="p-3 text-left">{'ধরন'}</th>
              <th className="p-3 text-left">{'শিরোনাম'}</th>
              <th className="p-3 text-right">{'কাজ'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-muted-foreground">
                  {'এই শিক্ষাবর্ষে এখনো কোনো ইভেন্ট নেই।'}
                </td>
              </tr>
            )}
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-surface-muted/30">
                <td className="p-3 whitespace-nowrap tabular-nums text-muted-foreground">
                  {formatDateShort(event.startDate, 'bn')}
                  {event.endDate !== event.startDate ? ` – ${formatDateShort(event.endDate, 'bn')}` : ''}
                </td>
                <td className="p-3">
                  <StatusBadge enumName="AcademicEventType" value={event.eventType} />
                </td>
                <td className="p-3">
                  <p className="font-semibold text-foreground">{event.title}</p>
                  {event.description && <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button type="button" variant="ghost" size="sm" onClick={() => fill(event)}>
                    <Pencil className="w-4 h-4" />
                    {'সম্পাদনা'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={removing} onClick={() => onRemove(event.id)}>
                    <Trash2 className="w-4 h-4" />
                    {'মুছুন'}
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
