'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, FileText, Image as ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import {
  useDeleteSyllabusMutation,
  useGetSchoolClassesQuery,
  useGetSyllabiQuery,
  useToggleSyllabusPublishMutation,
  useUploadSyllabusMutation,
  type SyllabusFileRecord,
} from '@/src/services/academic';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui/primitives';
import type { AcademicYear } from '@/src/types/entities';

const MAX_SYLLABUS_BYTES = 25 * 1024 * 1024;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val?: string) => Boolean(val && UUID_REGEX.test(val));

export function SyllabusPanel({ year }: { year: AcademicYear }) {
  const { locale, pick } = useI18n();
  const { data: classes = [] } = useGetSchoolClassesQuery();
  const [filterClassId, setFilterClassId] = useState<string>('');
  const { data: syllabi = [], isLoading } = useGetSyllabiQuery(
    isUuid(year?.id)
      ? {
          academicYearId: year.id,
          ...(isUuid(filterClassId) ? { classId: filterClassId } : {}),
        }
      : undefined,
    { skip: !isUuid(year?.id) }
  );
  const [uploadSyllabus, { isLoading: uploading }] = useUploadSyllabusMutation();
  const [togglePublish, { isLoading: toggling }] = useToggleSyllabusPublishMutation();
  const [deleteSyllabus, { isLoading: deleting }] = useDeleteSyllabusMutation();

  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublished(true);
    setFile(null);
    setOpen(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !classId || !file) {
      toast.error(pick('শিরোনাম, শ্রেণি এবং ফাইল দিন।', 'Title, class, and file are required.'));
      return;
    }
    if (file.size > MAX_SYLLABUS_BYTES) {
      toast.error(pick('সর্বোচ্চ ২৫ MB পর্যন্ত ফাইল আপলোড করা যাবে।', 'File must be under 25 MB.'));
      return;
    }

    const body = new FormData();
    body.set('academicYearId', year.id);
    body.set('classId', classId);
    body.set('title', title.trim());
    if (description.trim()) body.set('description', description.trim());
    body.set('isPublished', String(isPublished));
    body.set('file', file);

    try {
      await uploadSyllabus(body).unwrap();
      toast.success(pick('সিলেবাস সফলভাবে আপলোড হয়েছে।', 'Syllabus uploaded successfully.'));
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || pick('সিলেবাস আপলোড করা যায়নি।', 'Could not upload syllabus.'));
    }
  };

  const handleToggle = async (item: SyllabusFileRecord) => {
    try {
      await togglePublish({ id: item.id, isPublished: !item.isPublished }).unwrap();
      toast.success(pick('স্ট্যাটাস আপডেট হয়েছে।', 'Publish status updated.'));
    } catch (err: any) {
      toast.error(err?.message || pick('আপডেট করা যায়নি।', 'Could not update status.'));
    }
  };

  const handleDelete = async (item: SyllabusFileRecord) => {
    if (!window.confirm(pick('সিলেবাস ফাইলটি মুছে ফেলবেন?', 'Delete this syllabus file?'))) {
      return;
    }
    try {
      await deleteSyllabus(item.id).unwrap();
      toast.success(pick('সিলেবাস মুছে ফেলা হয়েছে।', 'Syllabus deleted.'));
    } catch (err: any) {
      toast.error(err?.message || pick('মুছে ফেলা যায়নি।', 'Could not delete syllabus.'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            aria-label={pick('শ্রেণি ফিল্টার', 'Filter by class')}
          >
            <option value="">{pick('সকল শ্রেণি', 'All Classes')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'bn' ? c.nameBn || c.name : c.name}
              </option>
            ))}
          </Select>
        </div>

        <Button type="button" variant="primary" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          {pick('সিলেবাস আপলোড করুন', 'Upload Syllabus')}
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-left font-semibold">{pick('শিরোনাম', 'Syllabus Title')}</th>
              <th className="p-3.5 text-left font-semibold">{pick('শ্রেণি', 'Class')}</th>
              <th className="p-3.5 text-left font-semibold">{pick('ফাইল', 'File')}</th>
              <th className="p-3.5 text-left font-semibold">{pick('তারিখ', 'Date')}</th>
              <th className="p-3.5 text-left font-semibold">{pick('অবস্থা', 'Published')}</th>
              <th className="p-3.5 text-right font-semibold">{pick('ব্যবস্থাপনা', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`syl-skel-${idx}`} className="animate-pulse">
                  <td className="p-3.5"><div className="h-5 w-48 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-24 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-20 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-4 w-24 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-6 w-12 rounded-full bg-surface-muted" /></td>
                  <td className="p-3.5 text-right"><div className="inline-block h-8 w-24 rounded bg-surface-muted" /></td>
                </tr>
              ))
            ) : syllabi.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center text-muted-foreground">
                  <p className="text-base font-semibold text-foreground">
                    {pick('কোনো সিলেবাস পাওয়া যায়নি', 'No syllabus files uploaded yet')}
                  </p>
                  <p className="text-sm mt-1">
                    {pick(
                      'উপরের "সিলেবাস আপলোড করুন" বাটনে ক্লিক করে PDF বা ইমেজ আপলোড করুন।',
                      'Click "Upload Syllabus" above to upload a PDF or image syllabus.'
                    )}
                  </p>
                </td>
              </tr>
            ) : (
              syllabi.map((item) => {
                const isPdf = item.attachmentMime === 'application/pdf';
                const sizeKb = item.attachmentLength
                  ? `${Math.ceil(item.attachmentLength / 1024)} KB`
                  : null;
                return (
                  <tr key={item.id}>
                    <td className="p-3.5 font-semibold text-foreground">{item.title}</td>
                    <td className="p-3.5 text-sm text-muted-foreground">
                      {locale === 'bn'
                        ? item.schoolClass?.nameBn || item.schoolClass?.name
                        : item.schoolClass?.name}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border bg-surface-muted text-foreground border-border">
                        {isPdf ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        {isPdf ? 'PDF' : pick('ইমেজ', 'Image')}
                        {sizeKb ? ` · ${sizeKb}` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-sm text-muted-foreground">
                      <span className="tabular-nums">{formatDateShort(item.createdAt, locale)}</span>
                    </td>
                    <td className="p-3.5">
                      <Switch
                        checked={item.isPublished}
                        disabled={toggling}
                        onChange={() => void handleToggle(item)}
                      />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {item.attachmentUrl && (
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {pick('দেখুন', 'View')}
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deleting}
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <Modal
        open={open}
        onClose={resetForm}
        title={pick('সিলেবাস ফাইল আপলোড', 'Upload Syllabus File')}
        description={pick(
          'PDF বা ইমেজ ফাইল আপলোড করুন—পাবলিক সিলেবাস পেজে দেখা যাবে।',
          'Upload a PDF or image syllabus for students and parents.'
        )}
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <FormField label={pick('শ্রেণি', 'Class')} required>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'bn' ? c.nameBn || c.name : c.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={pick('সিলেবাসের শিরোনাম', 'Syllabus Title')} required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={pick('যেমন: ষষ্ঠ শ্রেণির বার্ষিক সিলেবাস ২০২৬', 'e.g. Class 6 Annual Syllabus 2026')}
              required
            />
          </FormField>

          <FormField label={pick('ফাইল (PDF / JPG / PNG / WebP · সর্বোচ্চ ২৫ MB)', 'File (PDF / Image · Max 25 MB)')} required>
            {file ? (
              <div className="p-3 rounded-lg bg-surface-muted border border-border flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {file.name} ({Math.ceil(file.size / 1024)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 px-4 py-5 border border-dashed border-border hover:border-primary/50 rounded-lg bg-surface-muted/30 cursor-pointer text-center">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {pick('সিলেবাস PDF বা ইমেজ নির্বাচন করুন', 'Select Syllabus PDF or Image')}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            )}
          </FormField>

          <Switch
            checked={isPublished}
            onChange={setIsPublished}
            label={pick('সরাসরি প্রকাশ করুন', 'Publish immediately')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={uploading} onClick={resetForm}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={uploading}>
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? pick('আপলোড হচ্ছে...', 'Uploading...') : pick('আপলোড করুন', 'Upload Syllabus')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
