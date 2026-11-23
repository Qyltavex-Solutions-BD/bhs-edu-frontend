'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, IdCard, Printer, Search, Users } from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import {
  PrintableBulkExamAdmitCards,
  PrintableExamAdmitCard,
  type PrintableExamAdmitCardProps,
} from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import { EnrollmentStatus } from '@/src/types/enums';
import {
  buildSeatPlanRooms,
  getExamEnrolledStudents,
  resolveStudentParents,
} from './ExamShared';

export function ExamAdmitCardsView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [previewCard, setPreviewCard] = useState<PrintableExamAdmitCardProps | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const activeExams = useMemo(
    () => (db ? db.exams.filter((e) => !e.isDeleted) : []),
    [db]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const admitCardItems = useMemo(() => {
    if (!db || !activeExam) return [];
    const cls = db.classes.find((c) => c.id === activeExam.classId);
    const year = db.academicYears.find((y) => y.id === activeExam.academicYearId);
    const { seatLookup } = buildSeatPlanRooms(db, activeExam, locale);
    const examRoutines = db.examRoutines
      .filter((r) => !r.isDeleted && r.examId === activeExam.id)
      .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime));

    const enrollments = getExamEnrolledStudents(db, activeExam);
    const q = search.trim().toLowerCase();

    return enrollments
      .filter((enr) => {
        if (sectionFilter !== 'ALL' && enr.sectionId !== sectionFilter) return false;
        if (groupFilter !== 'ALL' && (enr.groupId ?? '') !== groupFilter) return false;
        if (q) {
          const stu = db.students.find((s) => s.id === enr.studentId);
          const hay = `${stu?.nameBn ?? ''} ${stu?.nameEn ?? ''} ${stu?.studentId ?? ''} ${enr.roll}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((enr) => {
        const stu = db.students.find((s) => s.id === enr.studentId);
        const sec = db.sections.find((s) => s.id === enr.sectionId);
        const grp = enr.groupId ? db.academicGroups.find((g) => g.id === enr.groupId) : null;
        const { fatherName, motherName } = resolveStudentParents(db, enr.studentId, locale);
        const seatInfo = seatLookup.get(enr.id);

        const schedule = examRoutines
          .filter((rt) => {
            if (rt.sectionId && rt.sectionId !== enr.sectionId) return false;
            const es = db.examSubjects.find((x) => x.id === rt.examSubjectId);
            if (!es) return false;
            if (es.groupId && es.groupId !== enr.groupId) return false;
            return true;
          })
          .map((rt) => {
            const es = db.examSubjects.find((x) => x.id === rt.examSubjectId);
            const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;
            return {
              examDate: rt.examDate,
              startTime: rt.startTime,
              endTime: rt.endTime,
              subjectCode: sub?.officialCode ?? '—',
              subjectName: locale === 'bn' ? sub?.nameBn || sub?.name || '—' : sub?.name || '—',
              roomNo: rt.roomNo ?? seatInfo?.roomNo ?? null,
            };
          });

        const props: PrintableExamAdmitCardProps = {
          school: db.schoolProfile,
          examName: activeExam.name,
          academicYear: year?.name ?? '2026',
          student: {
            studentId: stu?.studentId ?? enr.studentId,
            nameBn: stu?.nameBn,
            nameEn: stu?.nameEn ?? 'Student',
            fatherName,
            motherName,
            photo: stu?.photo ?? null,
            roll: enr.roll,
            className: locale === 'bn' ? cls?.nameBn || cls?.name || '' : cls?.name || '',
            sectionName: sec?.name ?? '',
            groupName: grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null,
            hallRoom: seatInfo ? `${seatInfo.roomNo}${seatInfo.buildingName ? ` (${seatInfo.buildingName})` : ''}` : null,
            seatNo: seatInfo?.seatNo ?? null,
          },
          schedule,
        };

        return {
          enrollmentId: enr.id,
          isEligible: enr.status === EnrollmentStatus.ACTIVE,
          props,
        };
      });
  }, [db, activeExam, locale, sectionFilter, groupFilter, search]);

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  const classSections = activeExam ? db.sections.filter((s) => s.classId === activeExam.classId) : [];
  const activeClass = activeExam ? db.classes.find((c) => c.id === activeExam.classId) : null;
  const isNineTen = (activeClass?.numericValue ?? 0) >= 9;

  const selectedItems = admitCardItems.filter((item) => selectedIds[item.enrollmentId]);
  const bulkTargets = selectedItems.length > 0 ? selectedItems : admitCardItems;
  const assignedSeatsCount = admitCardItems.filter((i) => Boolean(i.props.student.hallRoom)).length;
  const readyCount = admitCardItems.filter((i) => i.props.schedule.length > 0).length;
  const allFilteredChecked =
    admitCardItems.length > 0 && admitCardItems.every((i) => selectedIds[i.enrollmentId]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      admitCardItems.forEach((i) => {
        next[i.enrollmentId] = true;
      });
    }
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষার প্রবেশপত্র (Admit Card)"
        titleEn="Examination Admit Cards"
        subtitleBn="শিক্ষার্থীর ছবি, রোল, নির্ধারিত হল রুম ও ব্যক্তিগত পরীক্ষার রুটিনসহ প্রাতিষ্ঠানিক প্রবেশপত্র একক বা একসাথে বাল্ক প্রিন্ট করুন।"
        subtitleEn="Generate and bulk-print official institutional examination admit cards with room/seat allocations and student timetables."
        actions={
          <Button
            onClick={() => setBulkOpen(true)}
            disabled={bulkTargets.length === 0}
            className="whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            {selectedItems.length > 0
              ? pick(
                  `নির্বাচিত ${formatNumber(selectedItems.length, locale)}টি প্রবেশপত্র প্রিন্ট`,
                  `Bulk Print ${selectedItems.length} Selected`
                )
              : pick(
                  `সকল (${formatNumber(bulkTargets.length, locale)}) প্রবেশপত্র প্রিন্ট`,
                  `Bulk Print All (${bulkTargets.length})`
                )}
          </Button>
        }
      />

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট পরীক্ষার্থী', 'Total Examinees')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(admitCardItems.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `শ্রেণি: ${locale === 'bn' ? activeClass?.nameBn || activeClass?.name || '—' : activeClass?.name || '—'}`,
              `Class: ${activeClass?.name || '—'}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('প্রবেশপত্র প্রস্তুতি স্থিতি', 'Admit Card Preparation')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(readyCount, locale)} / {formatNumber(admitCardItems.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `রুটিনযুক্ত ${formatNumber(readyCount, 'bn')} · বাকি ${formatNumber(Math.max(0, admitCardItems.length - readyCount), 'bn')}`,
              `Prepared ${readyCount} · Missing routine ${Math.max(0, admitCardItems.length - readyCount)}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('আসন নির্ধারিত শিক্ষার্থী', 'Seats Assigned')}
          </p>
          <p className={cn('mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums', assignedSeatsCount === admitCardItems.length && admitCardItems.length > 0 ? 'text-success' : 'text-foreground')}>
            {formatNumber(assignedSeatsCount, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `সিট নির্ধারিত ${formatNumber(assignedSeatsCount, 'bn')} · অনির্ধারিত ${formatNumber(Math.max(0, admitCardItems.length - assignedSeatsCount), 'bn')}`,
              `Assigned ${assignedSeatsCount} · Unassigned ${Math.max(0, admitCardItems.length - assignedSeatsCount)}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('নির্বাচিত প্রিন্ট তালিকা', 'Selected for Print')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(selectedItems.length || admitCardItems.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              selectedItems.length > 0 ? `${formatNumber(selectedItems.length, 'bn')}টি কার্ড নির্বাচিত` : 'সকল কার্ড প্রিন্টের জন্য প্রস্তুত',
              selectedItems.length > 0 ? `${selectedItems.length} card(s) selected` : 'All cards ready for print'
            )}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[230px]">
          <label className="block text-xs text-muted-foreground mb-1">{pick('পরীক্ষা নির্বাচন করুন', 'Examination')}</label>
          <Select
            value={resolvedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSectionFilter('ALL');
              setGroupFilter('ALL');
              setSelectedIds({});
            }}
          >
            {activeExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <label className="block text-xs text-muted-foreground mb-1">{pick('শাখা', 'Section')}</label>
          <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="ALL">{pick('সকল শাখা', 'All Sections')}</option>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {pick('শাখা', 'Section')} {s.name}
              </option>
            ))}
          </Select>
        </div>

        {isNineTen && (
          <div className="w-44">
            <label className="block text-xs text-muted-foreground mb-1">{pick('বিভাগ', 'Group')}</label>
            <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="ALL">{pick('সকল বিভাগ', 'All Groups')}</option>
              {db.academicGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {locale === 'bn' ? g.nameBn : g.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="relative w-56">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={pick('নাম, রোল বা আইডি...', 'Name, roll or ID...')}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Examinees List */}
      {admitCardItems.length === 0 ? (
        <EmptyState
          title={pick('কোনো পরীক্ষার্থী পাওয়া যায়নি', 'No examinees found')}
          description={pick('অনুগ্রহ করে অন্য পরীক্ষা বা শাখা নির্বাচন করুন।', 'Try selecting a different exam or section.')}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-xs">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label={pick('সব নির্বাচন করুন', 'Select all')}
                    />
                  </th>
                  <th className="px-3 py-3 text-center w-16">{pick('রোল', 'Roll')}</th>
                  <th className="px-4 py-3 text-left">{pick('শিক্ষার্থী ও আইডি', 'Student & ID')}</th>
                  <th className="px-3 py-3 text-left">{pick('শাখা ও বিভাগ', 'Section & Group')}</th>
                  <th className="px-3 py-3 text-left">{pick('নির্ধারিত কক্ষ ও আসন', 'Assigned Hall & Seat')}</th>
                  <th className="px-3 py-3 text-center">{pick('রুটিন বিষয়', 'Subjects')}</th>
                  <th className="px-4 py-3 text-right">{pick('প্রবেশপত্র', 'Admit Card')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {admitCardItems.map((item) => {
                  const st = item.props.student;
                  return (
                    <tr key={item.enrollmentId} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedIds[item.enrollmentId])}
                          onChange={(e) =>
                            setSelectedIds((prev) => ({ ...prev, [item.enrollmentId]: e.target.checked }))
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-center font-bold">{formatNumber(st.roll, locale)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {locale === 'bn' ? st.nameBn || st.nameEn : st.nameEn}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">{st.studentId}</p>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="font-medium text-foreground">
                          {st.className} ({st.sectionName})
                        </span>
                        {st.groupName && (
                          <span className="block text-muted-foreground">{st.groupName}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="font-medium text-foreground">
                          {st.hallRoom || pick('নির্ধারিত হয়নি', 'Not Assigned')}
                        </span>
                        {st.seatNo && (
                          <span className="block text-muted-foreground">
                            {pick('আসন নং:', 'Seat #')} {formatNumber(st.seatNo, locale)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-medium">
                        {formatNumber(item.props.schedule.length, locale)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewCard(item.props)}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {pick('দেখুন ও প্রিন্ট', 'Preview & Print')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Single Admit Card Print Modal */}
      <Modal
        open={Boolean(previewCard)}
        onClose={() => setPreviewCard(null)}
        title={pick('প্রাতিষ্ঠানিক প্রবেশপত্র প্রিভিউ', 'Official Admit Card Preview')}
        size="xl"
      >
        {previewCard && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <Button onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {pick('প্রবেশপত্র প্রিন্ট করুন', 'Print Admit Card')}
              </Button>
            </div>
            <PrintableExamAdmitCard {...previewCard} />
          </div>
        )}
      </Modal>

      {/* Bulk Admit Cards Print Modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={pick(
          `বাল্ক প্রবেশপত্র প্রিন্ট (${formatNumber(bulkTargets.length, locale)} জন)`,
          `Bulk Print Admit Cards (${bulkTargets.length} students)`
        )}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 no-print text-sm text-muted-foreground">
            <span>
              {pick(
                'প্রতিটি শিক্ষার্থীর প্রবেশপত্র পৃথক A4 পৃষ্ঠায় স্বয়ংক্রিয়ভাবে প্রিন্ট হবে।',
                'Each student admit card automatically prints on its own crisp A4 page.'
              )}
            </span>
            <Button onClick={() => triggerPrint()} className="whitespace-nowrap shrink-0">
              <Printer className="w-4 h-4" />
              {pick('সবগুলো প্রিন্ট করুন', 'Print All Pages')}
            </Button>
          </div>
          <PrintableBulkExamAdmitCards items={bulkTargets.map((t) => t.props)} />
        </div>
      </Modal>
    </div>
  );
}
