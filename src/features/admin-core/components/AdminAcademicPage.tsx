'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  GripVertical,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useAddSyllabusEntryMutation,
  useGetBootstrapQuery,
  useRemoveSyllabusEntryMutation,
  useRemoveSyllabusFileMutation,
  useReorderCmsItemsMutation,
  useSaveSyllabusFileMutation,
  useToggleCmsItemMutation,
  useToggleRolePermissionMutation,
  useUpdateSchoolProfileMutation,
} from '@/src/store/api';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import {
  getCommitteePortrait,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  SegmentedTabs,
  Select,
  Switch,
  Textarea,
} from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { DataTable } from '@/src/components/shared/DataTable';
import type { SyllabusExamTerm } from '@/src/types/entities';
import {
  AcademicFoundation,
  useAcademicYearSelection,
} from '@/src/views/admin/AcademicFoundation';
import { useGetAcademicYearsQuery } from '@/src/services/academic';
import { AcademicShell } from '@/src/views/admin/AcademicShell';
import { AcademicCalendar } from '@/src/views/admin/AcademicCalendar';
import { AcademicCurriculum } from '@/src/views/admin/AcademicCurriculum';
import { AcademicPolicies } from '@/src/views/admin/AcademicPolicies';
import { AcademicRoutine } from '@/src/views/admin/AcademicRoutine';
import { SyllabusPanel } from '@/src/features/academic/components/admin/SyllabusPanel';
import { AcademicStaffing } from '@/src/views/admin/AcademicStaffing';

type AcademicTab =
  | 'years'
  | 'groups'
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'catalog'
  | 'books'
  | 'class-teachers'
  | 'assignments'
  | 'routines'
  | 'events'
  | 'documents'
  | 'policies';

const PAGE_COPY: Record<
  AcademicTab,
  { titleBn: string; titleEn: string; descBn: string; descEn: string; year: boolean }
> = {
  years: {
    titleBn: 'শিক্ষাবর্ষ',
    titleEn: 'Academic years',
    descBn: 'এক সময়ে একটি বছর চলতি সেশন। অন্য বছর খুলে আগের সেশনের তথ্য দেখা যায়।',
    descEn: 'One year is the current session. Open another year to review a previous session.',
    year: false,
  },
  groups: {
    titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
    titleEn: 'Classes & Sections (6–10)',
    descBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি এবং ৯ম–১০ম শ্রেণির বিভাগসমূহ নির্ধারিত। প্রতিটি শ্রেণির শাখা এখান থেকেই পরিচালনা করুন।',
    descEn: 'Classes 6–10 and streams for 9–10 are fixed. Manage sections directly per class.',
    year: false,
  },
  classes: {
    titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
    titleEn: 'Classes & Sections (6–10)',
    descBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি এবং ৯ম–১০ম শ্রেণির বিভাগসমূহ নির্ধারিত। প্রতিটি শ্রেণির শাখা এখান থেকেই পরিচালনা করুন।',
    descEn: 'Classes 6–10 and streams for 9–10 are fixed. Manage sections directly per class.',
    year: false,
  },
  sections: {
    titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
    titleEn: 'Classes & Sections (6–10)',
    descBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি এবং ৯ম–১০ম শ্রেণির বিভাগসমূহ নির্ধারিত। প্রতিটি শ্রেণির শাখা এখান থেকেই পরিচালনা করুন।',
    descEn: 'Classes 6–10 and streams for 9–10 are fixed. Manage sections directly per class.',
    year: false,
  },
  catalog: {
    titleBn: 'বিষয় ও পাঠ্যবই',
    titleEn: 'Subjects & Books',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে ও পাঠ্যবই এক জায়গা থেকে পরিচালনা করুন।',
    descEn: 'Manage class subjects and textbooks for this academic year from one place.',
    year: true,
  },
  subjects: {
    titleBn: 'বিষয় ও পাঠ্যবই',
    titleEn: 'Subjects & Books',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে ও পাঠ্যবই এক জায়গা থেকে পরিচালনা করুন।',
    descEn: 'Manage class subjects and textbooks for this academic year from one place.',
    year: true,
  },
  books: {
    titleBn: 'বিষয় ও পাঠ্যবই',
    titleEn: 'Subjects & Books',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে ও পাঠ্যবই এক জায়গা থেকে পরিচালনা করুন।',
    descEn: 'Manage class subjects and textbooks for this academic year from one place.',
    year: true,
  },
  'class-teachers': {
    titleBn: 'শিক্ষক বণ্টন',
    titleEn: 'Teacher Allocation',
    descBn: 'একই জায়গা থেকে প্রতিটি শাখার শ্রেণি শিক্ষক ও বিষয় শিক্ষক নির্ধারণ করুন।',
    descEn: 'Assign class teachers and subject teachers for each section in one place.',
    year: true,
  },
  assignments: {
    titleBn: 'শিক্ষক বণ্টন',
    titleEn: 'Teacher Allocation',
    descBn: 'একই জায়গা থেকে প্রতিটি শাখার শ্রেণি শিক্ষক ও বিষয় শিক্ষক নির্ধারণ করুন।',
    descEn: 'Assign class teachers and subject teachers for each section in one place.',
    year: true,
  },
  routines: {
    titleBn: 'ক্লাস রুটিন',
    titleEn: 'Class timetable',
    descBn: 'পাবলিক রুটিনের মতো সাপ্তাহিক সময়সূচি। পিরিয়ড যোগ, সরানো ও মুছা যায়।',
    descEn: 'The weekly timetable, in the same layout as the public page.',
    year: true,
  },
  events: {
    titleBn: 'একাডেমিক ক্যালেন্ডার',
    titleEn: 'Academic calendar',
    descBn: 'ছুটি, অনুষ্ঠান ও ভর্তির তারিখ এই শিক্ষাবর্ষে থাকে।',
    descEn: 'Holidays, events, and admission dates for this academic year.',
    year: true,
  },
  documents: {
    titleBn: 'সিলেবাস',
    titleEn: 'Syllabus',
    descBn: 'অধ্যায়ের তালিকা ও অফিসিয়াল ফাইল। বিষয় এই বছরের পাঠ্যক্রম থেকে আসে।',
    descEn: 'Chapter lists and official files. Subjects come from this year’s curriculum.',
    year: true,
  },
  policies: {
    titleBn: 'নীতিমালা',
    titleEn: 'School policies',
    descBn: 'শিক্ষার্থী বিধি, অভিভাবক নির্দেশনা ও পোশাকবিধি। প্রকাশিত হলে পাবলিক পাতায় যায়।',
    descEn: 'Student rules, parent guidelines, and dress code. Published items appear on the public page.',
    year: false,
  },
};

export function AdminAcademicPage({
  defaultTab = 'years',
}: {
  defaultTab?: AcademicTab;
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { data: realAcademicYears, isLoading: loadingYears } = useGetAcademicYearsQuery();
  const yearList = realAcademicYears && realAcademicYears.length > 0 ? realAcademicYears : db?.academicYears;
  const selectedYear = useAcademicYearSelection(yearList);
  const [saveSyllabusFile, { isLoading: savingSyllabusFile }] = useSaveSyllabusFileMutation();
  const [addSyllabusEntry, { isLoading: addingSyllabusEntry }] = useAddSyllabusEntryMutation();
  const [removeSyllabusEntry] = useRemoveSyllabusEntryMutation();
  const [removeSyllabusFile] = useRemoveSyllabusFileMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const [syllabusFileForm, setSyllabusFileForm] = useState<{
    classId: string;
    examTerm: SyllabusExamTerm;
    groupId: string;
    title: string;
    fileName: string;
    fileSize: string;
    fileType: 'PDF' | 'IMAGE';
    fileUrl: string;
  }>({
    classId: 'cls-10',
    examTerm: 'HALF_YEARLY',
    groupId: '',
    title: '',
    fileName: '',
    fileSize: '',
    fileType: 'PDF',
    fileUrl: '',
  });
  const [syllabusEntryForm, setSyllabusEntryForm] = useState<{
    classId: string;
    examTerm: SyllabusExamTerm;
    groupId: string;
    subjectId: string;
    chaptersBn: string;
    marksBreakdownBn: string;
  }>({
    classId: 'cls-10',
    examTerm: 'HALF_YEARLY',
    groupId: '',
    subjectId: 'sub-101',
    chaptersBn: '',
    marksBreakdownBn: 'সৃজনশীল ৭০ + বহুনির্বাচনি ৩০ = ১০০',
  });
  const [syllabusModal, setSyllabusModal] = useState<null | 'file' | 'entry'>(null);

  if (isLoading || loadingYears || !db) return <LoadingSkeleton />;

  const curriculumSubjectsFor = (classId: string, groupId: string) => {
    const schoolClass = db.classes.find((item) => item.id === classId);
    const stream = (schoolClass?.numericValue ?? 0) >= 9 ? groupId : '';
    const seen = new Set<string>();
    return db.classSubjects.flatMap((row) => {
      if (!row.isActive || row.academicYearId !== selectedYear?.id || row.classId !== classId) return [];
      if (stream) {
        if (row.groupId !== stream && row.groupId != null) return [];
      } else if (row.groupId != null) {
        return [];
      }
      if (seen.has(row.subjectId)) return [];
      seen.add(row.subjectId);
      const subject = db.subjects.find((item) => item.id === row.subjectId);
      return subject ? [subject] : [];
    });
  };

  const groupsOnCurriculum = (classId: string) =>
    db.academicGroups.filter((group) =>
      db.classSubjects.some(
        (row) =>
          row.isActive &&
          row.academicYearId === selectedYear?.id &&
          row.classId === classId &&
          row.groupId === group.id
      )
    );

  const handleSyllabusFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const formattedSize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      setSyllabusFileForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: formattedSize,
        fileType: isPdf ? 'PDF' : 'IMAGE',
        fileUrl: typeof reader.result === 'string' ? reader.result : '',
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSyllabusFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) {
      toast.error(pick('আগে একটি শিক্ষাবর্ষ নির্বাচন করুন।', 'Select an academic year first.'));
      return;
    }
    if (!syllabusFileForm.title.trim() || !syllabusFileForm.fileName) {
      toast.error(pick('অনুগ্রহ করে শিরোনাম ও সিলেবাস ফাইল নির্বাচন করুন।', 'Please provide a title and select a file.'));
      return;
    }
    try {
      await saveSyllabusFile({
        academicYearId: selectedYear?.id ?? '',
        classId: syllabusFileForm.classId,
        groupId: syllabusFileForm.groupId || null,
        examTerm: syllabusFileForm.examTerm,
        title: syllabusFileForm.title.trim(),
        fileName: syllabusFileForm.fileName,
        fileSize: syllabusFileForm.fileSize || '250 KB',
        fileType: syllabusFileForm.fileType,
        fileUrl: syllabusFileForm.fileUrl || null,
        publishedAt: new Date().toISOString().slice(0, 10),
        isPublished: true,
      }).unwrap();
      toast.success(pick('সিলেবাস ফাইল সফলভাবে প্রকাশিত হয়েছে।', 'Syllabus file published successfully.'));
      setSyllabusModal(null);
      setSyllabusFileForm((prev) => ({
        ...prev,
        title: '',
        fileName: '',
        fileSize: '',
        fileUrl: '',
      }));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          pick('সিলেবাস ফাইল সংরক্ষণে সমস্যা হয়েছে।', 'Failed to save syllabus file.')
      );
    }
  };

  const handleAddSyllabusEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) {
      toast.error(pick('আগে একটি শিক্ষাবর্ষ নির্বাচন করুন।', 'Select an academic year first.'));
      return;
    }
    if (!syllabusEntryForm.chaptersBn.trim()) {
      toast.error(pick('নির্ধারিত অধ্যায়ের বিবরণ লিখুন।', 'Please enter chapter scope details.'));
      return;
    }
    const allowedSubjects = curriculumSubjectsFor(syllabusEntryForm.classId, syllabusEntryForm.groupId);
    if (!allowedSubjects.some((subject) => subject.id === syllabusEntryForm.subjectId)) {
      toast.error(
        pick(
          'এই বিষয়টি ওই শ্রেণির এই শিক্ষাবর্ষের পাঠ্যতালিকায় নেই।',
          'That subject is not on this class curriculum for the year.'
        )
      );
      return;
    }
    try {
      await addSyllabusEntry({
        academicYearId: selectedYear?.id ?? '',
        classId: syllabusEntryForm.classId,
        groupId: syllabusEntryForm.groupId || null,
        examTerm: syllabusEntryForm.examTerm,
        subjectId: syllabusEntryForm.subjectId,
        chaptersBn: syllabusEntryForm.chaptersBn.trim(),
        chaptersEn: syllabusEntryForm.chaptersBn.trim(),
        marksBreakdownBn: syllabusEntryForm.marksBreakdownBn.trim() || 'মোট নম্বর: ১০০',
        marksBreakdownEn: syllabusEntryForm.marksBreakdownBn.trim() || 'Total Marks: 100',
        displayOrder: db.syllabusEntries.length + 1,
      }).unwrap();
      toast.success(pick('অধ্যায়ভিত্তিক সিলেবাস যুক্ত হয়েছে।', 'Chapter-wise syllabus entry added.'));
      setSyllabusModal(null);
      setSyllabusEntryForm((prev) => ({ ...prev, chaptersBn: '' }));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          pick('সিলেবাস এন্ট্রি যুক্ত করতে ব্যর্থ হয়েছে।', 'Failed to add syllabus entry.')
      );
    }
  };

  const handleRemoveSyllabusFile = async (id: string) => {
    try {
      await removeSyllabusFile({ id }).unwrap();
      toast.success(pick('সিলেবাস ফাইল মুছে ফেলা হয়েছে।', 'Syllabus file removed.'));
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('ফাইল মোছা যায়নি।', 'Could not remove the file.'));
    }
  };

  const handleRemoveSyllabusEntry = async (id: string) => {
    try {
      await removeSyllabusEntry({ id }).unwrap();
      toast.success(pick('অধ্যায়ের সারি মুছে ফেলা হয়েছে।', 'Chapter row removed.'));
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('সারি মোছা যায়নি।', 'Could not remove the row.'));
    }
  };

  return (
    <AcademicShell
      title={pick(PAGE_COPY[tab].titleBn, PAGE_COPY[tab].titleEn)}
      description={pick(PAGE_COPY[tab].descBn, PAGE_COPY[tab].descEn)}
      years={yearList ?? db.academicYears}
      selectedYear={selectedYear}
      showYear={PAGE_COPY[tab].year}
    >

      {(tab === 'years' || tab === 'groups' || tab === 'classes' || tab === 'sections') && (
        <AcademicFoundation tab={tab} db={db} />
      )}

      {tab === 'subjects' && selectedYear && <AcademicCurriculum db={db} year={selectedYear} section="curriculum" />}

      {tab === 'catalog' && <AcademicCurriculum db={db} year={selectedYear ?? db.academicYears[0]} section="catalog" />}

      {tab === 'books' && selectedYear && <AcademicCurriculum db={db} year={selectedYear} section="books" />}

      {tab === 'class-teachers' && selectedYear && (
        <AcademicStaffing mode="class-teachers" db={db} year={selectedYear} />
      )}

      {tab === 'assignments' && selectedYear && (
        <AcademicStaffing mode="assignments" db={db} year={selectedYear} />
      )}

      {tab === 'events' && selectedYear && <AcademicCalendar db={db} year={selectedYear} />}

      {tab === 'routines' && selectedYear && <AcademicRoutine db={db} year={selectedYear} />}

      {tab === 'documents' && selectedYear && <SyllabusPanel year={selectedYear} />}

      {tab === 'policies' && <AcademicPolicies db={db} />}
    </AcademicShell>
  );
}

