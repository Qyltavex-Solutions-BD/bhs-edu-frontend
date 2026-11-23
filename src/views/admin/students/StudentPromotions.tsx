'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch } from '@/src/store/hooks';
import { setSelectedAcademicYear } from '@/src/store/slices/uiSlice';
import { usePromoteStudentsMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
} from '@/src/components/ui/primitives';
import {
  EnrollmentStatus,
  PromotionType,
  ResultPublicationStatus,
  ResultStatus,
  StudentStatus,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { ResultSummary, StudentEnrollment } from '@/src/types/entities';
import { classLabel, errorMessage, studentInitials } from './studentShared';

type DecisionValue = 'SKIP' | PromotionType.PROMOTED | PromotionType.RETAINED | 'GRADUATED';

interface RowDecision {
  decision: DecisionValue;
  sectionId: string;
  groupId: string;
  roll: string;
}

export function StudentPromotions({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [promote, { isLoading }] = usePromoteStudentsMutation();

  const sortedClasses = useMemo(
    () => [...db.classes].sort((a, b) => a.numericValue - b.numericValue),
    [db.classes]
  );

  const sourceYear = db.academicYears.find((y) => y.id === yearId);
  // Prefer next chronological academic year (e.g. 2027 when source is 2026)
  const targetYears = useMemo(() => {
    const others = db.academicYears.filter((y) => y.id !== yearId);
    const sourceNum = Number(sourceYear?.name ?? 0);
    return [...others].sort((a, b) => {
      const an = Number(a.name);
      const bn = Number(b.name);
      const aFuture = an > sourceNum ? 1 : 0;
      const bFuture = bn > sourceNum ? 1 : 0;
      if (aFuture !== bFuture) return bFuture - aFuture;
      return an - bn;
    });
  }, [db.academicYears, yearId, sourceYear?.name]);

  const [classId, setClassId] = useState(sortedClasses[0]?.id ?? '');
  const [targetYearId, setTargetYearId] = useState(targetYears[0]?.id ?? '');
  const [selectedExamId, setSelectedExamId] = useState<string>('AUTO');
  const [choices, setChoices] = useState<Record<string, RowDecision>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastRun, setLastRun] = useState<{
    promoted: number;
    retained: number;
    graduated: number;
    toYearId: string;
    toYearName: string;
  } | null>(null);

  // Ensure targetYearId stays valid when yearId changes from top selector
  const resolvedTargetYearId = targetYears.some((y) => y.id === targetYearId)
    ? targetYearId
    : targetYears[0]?.id ?? '';
  const targetYear = db.academicYears.find((y) => y.id === resolvedTargetYearId);

  const sourceClass = db.classes.find((item) => item.id === classId);
  const nextClass =
    db.classes.find((item) => item.numericValue === (sourceClass?.numericValue ?? 0) + 1) ??
    sourceClass;
  const isTopClass = (sourceClass?.numericValue ?? 0) >= 10;

  // Exams available for this source year + class (published first)
  const classExams = useMemo(() => {
    return db.exams
      .filter((e) => !e.isDeleted && e.academicYearId === yearId && e.classId === classId)
      .sort((a, b) => {
        const aPub = a.resultStatus === ResultPublicationStatus.PUBLISHED ? 1 : 0;
        const bPub = b.resultStatus === ResultPublicationStatus.PUBLISHED ? 1 : 0;
        if (aPub !== bPub) return bPub - aPub;
        return b.startDate.localeCompare(a.startDate);
      });
  }, [db.exams, yearId, classId]);

  const activeExam = useMemo(() => {
    if (selectedExamId === 'NONE') return null;
    if (selectedExamId === 'AUTO') {
      return (
        classExams.find((e) => e.resultStatus === ResultPublicationStatus.PUBLISHED) ??
        classExams[0] ??
        null
      );
    }
    return classExams.find((e) => e.id === selectedExamId) ?? null;
  }, [classExams, selectedExamId]);

  // Active eligible students in selected class & year
  const candidates = useMemo(() => {
    return db.enrollments
      .filter((item) => {
        if (item.academicYearId !== yearId || item.classId !== classId) return false;
        if (item.status !== EnrollmentStatus.ACTIVE) return false;
        const st = db.students.find((s) => s.id === item.studentId);
        return st?.status === StudentStatus.ACTIVE;
      })
      .sort((a, b) => {
        const sa = db.sections.find((s) => s.id === a.sectionId)?.name ?? '';
        const sb = db.sections.find((s) => s.id === b.sectionId)?.name ?? '';
        return sa.localeCompare(sb) || a.roll - b.roll;
      });
  }, [db.enrollments, db.students, db.sections, yearId, classId]);

  // Map enrollmentId -> ResultSummary for the active reference exam
  const resultsByEnrollment = useMemo(() => {
    const map = new Map<string, ResultSummary>();
    if (!activeExam) return map;
    for (const r of db.resultSummaries) {
      if (r.examId === activeExam.id) {
        map.set(r.studentEnrollmentId, r);
      }
    }
    return map;
  }, [db.resultSummaries, activeExam]);

  const hasResultData = candidates.some((enr) => resultsByEnrollment.has(enr.id));

  // Existing occupied rolls in target year so we warn about collisions before submitting
  const occupiedTargetRolls = useMemo(() => {
    const set = new Set<string>();
    if (!resolvedTargetYearId) return set;
    for (const enr of db.enrollments) {
      if (enr.academicYearId === resolvedTargetYearId) {
        set.add(`${enr.classId}|${enr.sectionId}|${enr.roll}`);
      }
    }
    return set;
  }, [db.enrollments, resolvedTargetYearId]);

  const defaultSectionFor = (enrollment: StudentEnrollment, targetClassId: string) => {
    const currentSection = db.sections.find((item) => item.id === enrollment.sectionId);
    return (
      db.sections.find(
        (item) => item.classId === targetClassId && item.name === currentSection?.name
      ) || db.sections.find((item) => item.classId === targetClassId)
    );
  };

  const defaultGroupFor = (enrollment: StudentEnrollment, targetClassId: string) => {
    const targetCls = db.classes.find((c) => c.id === targetClassId);
    if ((targetCls?.numericValue ?? 0) < 9) return '';
    return enrollment.groupId || db.academicGroups[0]?.id || '';
  };

  const choiceFor = (enrollment: StudentEnrollment): RowDecision => {
    const existing = choices[enrollment.id];
    if (existing) return existing;
    const defaultTargetClassId = isTopClass ? classId : nextClass?.id ?? classId;
    const targetSection = defaultSectionFor(enrollment, defaultTargetClassId);
    return {
      decision: 'SKIP',
      sectionId: targetSection?.id ?? '',
      groupId: defaultGroupFor(enrollment, defaultTargetClassId),
      roll: String(enrollment.roll),
    };
  };

  const setChoice = (
    enrollment: StudentEnrollment,
    patch: Partial<RowDecision>
  ) => {
    setChoices((current) => {
      const prev = choiceFor(enrollment);
      const next = { ...prev, ...patch };
      // If decision switched between PROMOTED and RETAINED, automatically map section & stream for the new target class
      if (patch.decision && patch.decision !== prev.decision) {
        const targetClassId =
          patch.decision === PromotionType.RETAINED
            ? classId
            : isTopClass
              ? classId
              : nextClass?.id ?? classId;
        const sec = defaultSectionFor(enrollment, targetClassId);
        next.sectionId = sec?.id ?? '';
        next.groupId = defaultGroupFor(enrollment, targetClassId);
      }
      return { ...current, [enrollment.id]: next };
    });
  };

  // One-click Result-Assisted Auto-Suggestion (Pass -> Promoted/Graduated + Merit Roll; Fail -> Retained)
  const applyResultAutoSuggest = () => {
    const nextChoices: Record<string, RowDecision> = {};
    // Track next sequential roll per (targetClassId|targetSectionId) to guarantee zero duplicates
    const usedRolls = new Set<string>(occupiedTargetRolls);

    // Order candidates by merit position first (for promoted), then roll
    const ordered = [...candidates].sort((a, b) => {
      const ra = resultsByEnrollment.get(a.id);
      const rb = resultsByEnrollment.get(b.id);
      const ma = ra?.meritPosition ?? 9999;
      const mb = rb?.meritPosition ?? 9999;
      if (ma !== mb) return ma - mb;
      return a.roll - b.roll;
    });

    const allocateRoll = (targetClassId: string, targetSectionId: string, preferred: number) => {
      let candidateRoll = Math.max(1, preferred);
      while (usedRolls.has(`${targetClassId}|${targetSectionId}|${candidateRoll}`)) {
        candidateRoll += 1;
      }
      usedRolls.add(`${targetClassId}|${targetSectionId}|${candidateRoll}`);
      return String(candidateRoll);
    };

    for (const enr of ordered) {
      const res = resultsByEnrollment.get(enr.id);
      if (!res) {
        nextChoices[enr.id] = {
          ...choiceFor(enr),
          decision: 'SKIP',
        };
        continue;
      }

      if (res.resultStatus === ResultStatus.FAIL) {
        const sec = defaultSectionFor(enr, classId);
        const secId = sec?.id ?? '';
        nextChoices[enr.id] = {
          decision: PromotionType.RETAINED,
          sectionId: secId,
          groupId: defaultGroupFor(enr, classId),
          roll: allocateRoll(classId, secId, enr.roll),
        };
      } else if (isTopClass) {
        nextChoices[enr.id] = {
          decision: 'GRADUATED',
          sectionId: '',
          groupId: '',
          roll: String(enr.roll),
        };
      } else {
        const targetClassId = nextClass?.id ?? classId;
        const sec = defaultSectionFor(enr, targetClassId);
        const secId = sec?.id ?? '';
        const preferredRoll = res.sectionMeritPosition ?? res.meritPosition ?? enr.roll;
        nextChoices[enr.id] = {
          decision: PromotionType.PROMOTED,
          sectionId: secId,
          groupId: defaultGroupFor(enr, targetClassId),
          roll: allocateRoll(targetClassId, secId, preferredRoll),
        };
      }
    }

    setChoices(nextChoices);
    toast.success(
      pick(
        'পরীক্ষার ফলাফল ও মেধাক্রম অনুযায়ী প্রমোশন প্রস্তাব তৈরি হয়েছে। যাচাই করে প্রয়োগ করুন।',
        'Auto-suggested promotion decisions and merit rolls from exam results. Review before applying.'
      )
    );
  };

  const selectAllPromote = () => {
    const nextChoices: Record<string, RowDecision> = {};
    const usedRolls = new Set<string>(occupiedTargetRolls);
    const targetClassId = isTopClass ? classId : nextClass?.id ?? classId;

    for (const enr of candidates) {
      if (isTopClass) {
        nextChoices[enr.id] = {
          decision: 'GRADUATED',
          sectionId: '',
          groupId: '',
          roll: String(enr.roll),
        };
      } else {
        const sec = defaultSectionFor(enr, targetClassId);
        const secId = sec?.id ?? '';
        let r = Math.max(1, enr.roll);
        while (usedRolls.has(`${targetClassId}|${secId}|${r}`)) r += 1;
        usedRolls.add(`${targetClassId}|${secId}|${r}`);
        nextChoices[enr.id] = {
          decision: PromotionType.PROMOTED,
          sectionId: secId,
          groupId: defaultGroupFor(enr, targetClassId),
          roll: String(r),
        };
      }
    }
    setChoices(nextChoices);
  };

  // Compute live validation & decision counts
  const summary = useMemo(() => {
    let promoteCount = 0;
    let retainCount = 0;
    let graduateCount = 0;
    const rollFrequency = new Map<string, number>();
    const collisionIds = new Set<string>();
    const missingStreamIds = new Set<string>();

    const evaluated = candidates.map((enr) => {
      const ch = choiceFor(enr);
      const moving =
        ch.decision === PromotionType.PROMOTED || ch.decision === PromotionType.RETAINED;
      const targetClassId =
        ch.decision === PromotionType.RETAINED ? classId : nextClass?.id ?? classId;
      const targetCls = db.classes.find((c) => c.id === targetClassId);
      const needsStream = moving && (targetCls?.numericValue ?? 0) >= 9;

      if (ch.decision === PromotionType.PROMOTED) promoteCount += 1;
      if (ch.decision === PromotionType.RETAINED) retainCount += 1;
      if (ch.decision === 'GRADUATED') graduateCount += 1;

      if (moving) {
        const rollNum = Number(ch.roll);
        const key = `${targetClassId}|${ch.sectionId}|${rollNum}`;
        if (!rollNum || rollNum < 1 || occupiedTargetRolls.has(key)) {
          collisionIds.add(enr.id);
        }
        rollFrequency.set(key, (rollFrequency.get(key) ?? 0) + 1);
        if (needsStream && !ch.groupId) {
          missingStreamIds.add(enr.id);
        }
      }

      return { enr, ch, moving, targetClassId, needsStream };
    });

    for (const row of evaluated) {
      if (!row.moving) continue;
      const key = `${row.targetClassId}|${row.ch.sectionId}|${Number(row.ch.roll)}`;
      if ((rollFrequency.get(key) ?? 0) > 1) {
        collisionIds.add(row.enr.id);
      }
    }

    const selectedTotal = promoteCount + retainCount + graduateCount;
    const skippedCount = candidates.length - selectedTotal;
    const showStreamColumn =
      (!isTopClass && (nextClass?.numericValue ?? 0) >= 9) || (sourceClass?.numericValue ?? 0) >= 9;

    return {
      promoteCount,
      retainCount,
      graduateCount,
      selectedTotal,
      skippedCount,
      collisionIds,
      missingStreamIds,
      showStreamColumn,
      hasValidationErrors: collisionIds.size > 0 || missingStreamIds.size > 0,
    };
  }, [candidates, choices, classId, nextClass, isTopClass, sourceClass, db.classes, occupiedTargetRolls]);

  const executePromotion = async () => {
    const items = candidates
      .map((enrollment) => ({ enrollment, choice: choiceFor(enrollment) }))
      .filter((row) => row.choice.decision !== 'SKIP')
      .map((row) => {
        const targetClassId =
          row.choice.decision === PromotionType.RETAINED || row.choice.decision === 'GRADUATED'
            ? classId
            : nextClass?.id;
        const targetCls = db.classes.find((c) => c.id === targetClassId);
        const res = resultsByEnrollment.get(row.enrollment.id);
        return {
          studentId: row.enrollment.studentId,
          fromEnrollmentId: row.enrollment.id,
          toClassId: targetClassId,
          toSectionId: row.choice.sectionId,
          toGroupId: (targetCls?.numericValue ?? 0) >= 9 ? row.choice.groupId || null : null,
          roll: Number(row.choice.roll),
          resultSummaryId: res?.id ?? null,
          promotionType: row.choice.decision as PromotionType | 'GRADUATED',
        };
      });

    if (!items.length) {
      toast.error(pick('অন্তত একজন শিক্ষার্থীর সিদ্ধান্ত নির্বাচন করুন।', 'Select at least one student decision.'));
      return;
    }

    try {
      const result = await promote({
        toAcademicYearId: resolvedTargetYearId,
        items,
      }).unwrap();
      setConfirmOpen(false);
      setChoices({});
      setLastRun({
        ...result,
        toYearId: resolvedTargetYearId,
        toYearName: targetYear?.name ?? '',
      });
      toast.success(
        pick(
          `প্রমোশন সম্পন্ন: উত্তীর্ণ ${formatNumber(result.promoted, 'bn')}, অকৃতকার্য ${formatNumber(result.retained, 'bn')}, সমাপ্ত ${formatNumber(result.graduated, 'bn')}।`,
          `Promotion complete: ${result.promoted} promoted, ${result.retained} retained, ${result.graduated} completed.`
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('প্রমোশন প্রক্রিয়া সম্পন্ন হয়নি।', 'Promotion failed.')));
    }
  };

  // Recent promotion audit log for this source academic year
  const sessionPromotionLogs = useMemo(() => {
    return db.promotions
      .map((promo) => {
        const fromEnr = db.enrollments.find((e) => e.id === promo.fromEnrollmentId);
        if (!fromEnr || fromEnr.academicYearId !== yearId) return null;
        const toEnr = db.enrollments.find((e) => e.id === promo.toEnrollmentId);
        const student = db.students.find((s) => s.id === promo.studentId);
        const fromSec = db.sections.find((s) => s.id === fromEnr.sectionId);
        const toSec = toEnr ? db.sections.find((s) => s.id === toEnr.sectionId) : null;
        const toYear = toEnr ? db.academicYears.find((y) => y.id === toEnr.academicYearId) : null;
        return {
          ...promo,
          studentName: student?.nameBn || student?.nameEn || '—',
          studentCode: student?.studentId ?? '',
          fromLabel: `${classLabel(db, fromEnr.classId, locale)} (${fromSec?.name ?? '—'}) · #${formatNumber(fromEnr.roll, locale)}`,
          toLabel: toEnr
            ? `${toYear?.name ?? ''} · ${classLabel(db, toEnr.classId, locale)} (${toSec?.name ?? '—'}) · #${formatNumber(toEnr.roll, locale)}`
            : '—',
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [db, yearId, locale]);

  const openTargetYearEnrollments = (toYearId: string) => {
    dispatch(setSelectedAcademicYear(toYearId));
    router.push('/admin/students/enrollments');
  };

  return (
    <div className="space-y-5">
      {/* Post-Promotion Success Callout with Direct Link to New Session Enrollments */}
      {lastRun && (
        <Card className="p-4 border-primary/40 bg-primary/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                {pick('শ্রেণি উত্তরণ ও নতুন এনরোলমেন্ট তৈরি হয়েছে', 'Promotion & New Session Enrollments Created')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                {pick(
                  `উত্তীর্ণ ${formatNumber(lastRun.promoted, locale)} জন · একই শ্রেণিতে ${formatNumber(lastRun.retained, locale)} জন · সমাপ্ত ${formatNumber(lastRun.graduated, locale)} জন। পূর্বের এনরোলমেন্ট লক করা হয়েছে।`,
                  `${lastRun.promoted} promoted · ${lastRun.retained} retained · ${lastRun.graduated} completed. Previous enrollments are now locked.`
                )}
              </p>
            </div>
          </div>
          {lastRun.toYearId && (lastRun.promoted > 0 || lastRun.retained > 0) && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => openTargetYearEnrollments(lastRun.toYearId)}
            >
              <span>
                {pick(
                  `${lastRun.toYearName} এনরোলমেন্ট দেখুন`,
                  `View ${lastRun.toYearName} Enrollments`
                )}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </Card>
      )}

      {/* 1. Promotion Configuration Bar */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={pick('উৎস শ্রেণি', 'Source Class')}>
            <Select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSelectedExamId('AUTO');
                setChoices({});
              }}
            >
              {sortedClasses.map((item) => {
                const cnt = db.enrollments.filter(
                  (e) =>
                    e.academicYearId === yearId &&
                    e.classId === item.id &&
                    e.status === EnrollmentStatus.ACTIVE
                ).length;
                return (
                  <option key={item.id} value={item.id}>
                    {locale === 'bn' ? item.nameBn || item.name : item.name} (
                    {formatNumber(cnt, locale)})
                  </option>
                );
              })}
            </Select>
          </FormField>

          <FormField
            label={pick('লক্ষ্য শিক্ষাবর্ষ (পরবর্তী সেশন)', 'Target Academic Year')}
            hint={
              isTopClass
                ? pick(
                    '১০ম শ্রেণির উত্তীর্ণ শিক্ষার্থীরা এসএসসি সমাপ্ত হিসেবে চিহ্নিত হবে।',
                    'Graduating Class 10 students are marked completed; retained students move to target year.'
                  )
                : pick(
                    `নতুন এনরোলমেন্ট তৈরি হবে → ${classLabel(db, nextClass?.id ?? '', locale)}`,
                    `New enrollments target → ${classLabel(db, nextClass?.id ?? '', locale)}`
                  )
            }
          >
            <Select
              value={resolvedTargetYearId}
              onChange={(event) => setTargetYearId(event.target.value)}
            >
              {targetYears.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {Number(item.name) > Number(sourceYear?.name ?? 0)
                    ? pick(' · পরবর্তী সেশন', ' · Next session')
                    : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={pick('রেফারেন্স পরীক্ষা (ফলাফলভিত্তিক সাজেশন)', 'Reference Exam (Result-Assisted)')}
            hint={
              activeExam
                ? activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                  ? pick('প্রকাশিত ফলাফল ও মেধাক্রম যুক্ত আছে।', 'Published results & merit ranks linked.')
                  : pick('এই পরীক্ষার ফলাফল এখনো খসড়া পর্যায়ে।', 'Selected exam results are still draft.')
                : pick('এই শ্রেণির প্রকাশিত ফলাফল নেই — ম্যানুয়াল সিদ্ধান্ত নিন।', 'No published exam for this class — assign manually.')
            }
          >
            <Select
              value={selectedExamId}
              onChange={(event) => setSelectedExamId(event.target.value)}
            >
              {classExams.length > 0 && (
                <option value="AUTO">
                  {pick('সর্বশেষ প্রকাশিত পরীক্ষা (স্বয়ংক্রিয়)', 'Latest published exam (Auto)')}
                </option>
              )}
              {classExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
              <option value="NONE">{pick('পরীক্ষা ছাড়া (ম্যানুয়াল)', 'No exam (Manual)')}</option>
            </Select>
          </FormField>
        </div>

        {/* Decision Summary Strip inside Configuration */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-border rounded-2xl divide-y lg:divide-y-0 divide-x divide-border bg-surface-muted/30">
          <div className="p-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('সক্রিয় প্রার্থী', 'Eligible Candidates')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground mt-1">
              {formatNumber(candidates.length, locale)}
            </p>
          </div>
          <div className="p-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {isTopClass ? pick('সমাপ্ত নির্বাচিত', 'Selected to Graduate') : pick('উত্তীর্ণ নির্বাচিত', 'Selected to Promote')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-primary mt-1">
              {formatNumber(isTopClass ? summary.graduateCount : summary.promoteCount, locale)}
            </p>
          </div>
          <div className="p-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('একই শ্রেণিতে (Retained)', 'Selected to Retain')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-secondary mt-1">
              {formatNumber(summary.retainCount, locale)}
            </p>
          </div>
          <div className="p-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('অনির্বাচিত / স্থগিত', 'Skipped / Pending')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-muted-foreground mt-1">
              {formatNumber(summary.skippedCount, locale)}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Promotion Decision Workspace Table */}
      <Card className="overflow-hidden">
        {/* Bulk Actions Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {hasResultData && (
              <Button size="sm" variant="secondary" onClick={applyResultAutoSuggest}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pick('ফলাফল অনুযায়ী অটো-সাজেশন', 'Auto-Suggest from Results')}</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={selectAllPromote}
              disabled={candidates.length === 0}
            >
              {isTopClass
                ? pick('সবাইকে সমাপ্ত নির্বাচন', 'Mark All Graduated')
                : pick('সবাইকে উত্তীর্ণ নির্বাচন', 'Promote All Active')}
            </Button>
            {summary.selectedTotal > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setChoices({})}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{pick('রিসেট', 'Reset')}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {summary.hasValidationErrors && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" />
                {summary.collisionIds.size > 0
                  ? pick('ডুপ্লিকেট বা অবৈধ রোল ঠিক করুন', 'Fix duplicate/invalid rolls')
                  : pick('নবম-দশম শ্রেণির বিভাগ নির্বাচন করুন', 'Select stream for Class 9–10')}
              </span>
            )}
            <Button
              size="sm"
              variant="primary"
              disabled={
                isLoading || summary.selectedTotal === 0 || summary.hasValidationErrors
              }
              onClick={() => setConfirmOpen(true)}
            >
              <span>
                {pick(
                  `সিদ্ধান্ত প্রয়োগ (${formatNumber(summary.selectedTotal, locale)})`,
                  `Review & Apply (${summary.selectedTotal})`
                )}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Table */}
        {candidates.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              {pick(
                'এই শ্রেণিতে উত্তরণের জন্য কোনো সক্রিয় এনরোলমেন্ট অবশিষ্ট নেই।',
                'No active enrollments remain for promotion in this class.'
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {pick(
                'অন্য শ্রেণি নির্বাচন করুন অথবা নিচের প্রমোশন ইতিহাস দেখুন।',
                'Select another class above or inspect the promotion log below.'
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-surface-muted/70 border-b border-border text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">{pick('বর্তমান রোল', 'Current')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{pick('পরীক্ষার অবস্থান', 'Exam Standing')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{pick('সিদ্ধান্ত', 'Decision')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{pick('লক্ষ্য শ্রেণি ও শাখা', 'Target Placement')}</th>
                  {summary.showStreamColumn && (
                    <th className="px-4 py-3 whitespace-nowrap">{pick('পরবর্তী বিভাগ', 'Target Stream')}</th>
                  )}
                  <th className="px-4 py-3 whitespace-nowrap">{pick('নতুন রোল', 'Next Roll')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((enrollment) => {
                  const student = db.students.find((item) => item.id === enrollment.studentId);
                  const currentSection = db.sections.find((s) => s.id === enrollment.sectionId);
                  const res = resultsByEnrollment.get(enrollment.id);
                  const choice = choiceFor(enrollment);
                  const moving =
                    choice.decision === PromotionType.PROMOTED ||
                    choice.decision === PromotionType.RETAINED;
                  const targetClassId =
                    choice.decision === PromotionType.RETAINED
                      ? classId
                      : nextClass?.id ?? classId;
                  const targetCls = db.classes.find((c) => c.id === targetClassId);
                  const needsStream = moving && (targetCls?.numericValue ?? 0) >= 9;
                  const hasRollConflict = summary.collisionIds.has(enrollment.id);
                  const missingStream = summary.missingStreamIds.has(enrollment.id);

                  return (
                    <tr
                      key={enrollment.id}
                      className={cn(
                        'transition-colors',
                        choice.decision !== 'SKIP' ? 'bg-primary/[0.02]' : 'hover:bg-surface-muted/40'
                      )}
                    >
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        <span className="font-mono font-semibold text-foreground">
                          #{String(enrollment.roll).padStart(2, '0')}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {pick('শাখা', 'Sec')} {currentSection?.name ?? '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3 min-w-[190px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[var(--radius)] bg-surface-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                            {studentInitials(student?.nameEn)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/students/${enrollment.studentId}`}
                              className="font-semibold text-foreground hover:text-primary hover:underline block truncate"
                            >
                              {student?.nameBn || student?.nameEn || '—'}
                            </Link>
                            <span className="block text-xs font-mono text-muted-foreground">
                              {student?.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {res ? (
                          <div className="space-y-0.5 tabular-nums">
                            <div className="flex items-center gap-2">
                              <StatusBadge enumName="ResultStatus" value={res.resultStatus} />
                              <span className="font-mono text-xs font-semibold text-foreground">
                                GPA {res.gpa != null ? res.gpa.toFixed(2) : '—'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {res.letterGrade || '—'}
                              {res.meritPosition
                                ? ` · ${pick('মেধাক্রম', 'Rank')} #${formatNumber(res.meritPosition, locale)}`
                                : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {pick('প্রকাশিত ফল নেই', 'No result')}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Select
                          value={choice.decision}
                          onChange={(event) =>
                            setChoice(enrollment, {
                              decision: event.target.value as DecisionValue,
                            })
                          }
                          className="h-9 min-w-[140px] text-sm"
                        >
                          <option value="SKIP">{pick('এখন নয় (Skip)', 'Skip')}</option>
                          {!isTopClass && (
                            <option value={PromotionType.PROMOTED}>
                              {pick('উত্তীর্ণ (Promoted)', 'Promoted')}
                            </option>
                          )}
                          <option value={PromotionType.RETAINED}>
                            {pick('একই শ্রেণিতে (Retained)', 'Retained')}
                          </option>
                          {isTopClass && (
                            <option value="GRADUATED">
                              {pick('এসএসসি সমাপ্ত (Graduated)', 'Graduated')}
                            </option>
                          )}
                        </Select>
                      </td>

                      <td className="px-4 py-3">
                        {moving ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {classLabel(db, targetClassId, locale)}
                            </span>
                            <Select
                              value={choice.sectionId}
                              onChange={(event) =>
                                setChoice(enrollment, { sectionId: event.target.value })
                              }
                              className="h-9 w-24 text-sm"
                            >
                              {db.sections
                                .filter((item) => item.classId === targetClassId)
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </Select>
                          </div>
                        ) : choice.decision === 'GRADUATED' ? (
                          <span className="text-xs font-medium text-primary">
                            {pick('বিদ্যালয় সমাপ্ত (Alumni)', 'Completed (Alumni)')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {summary.showStreamColumn && (
                        <td className="px-4 py-3">
                          {needsStream ? (
                            <Select
                              value={choice.groupId}
                              onChange={(event) =>
                                setChoice(enrollment, { groupId: event.target.value })
                              }
                              className={cn(
                                'h-9 min-w-[132px] text-sm',
                                missingStream && 'border-destructive'
                              )}
                            >
                              <option value="">{pick('বিভাগ বাছুন', 'Select stream')}</option>
                              {db.academicGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {locale === 'bn' ? g.nameBn || g.name : g.name}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        {moving ? (
                          <Input
                            type="number"
                            min={1}
                            value={choice.roll}
                            onChange={(event) =>
                              setChoice(enrollment, { roll: event.target.value })
                            }
                            className={cn(
                              'h-9 w-24 font-mono tabular-nums text-sm',
                              hasRollConflict && 'border-destructive text-destructive'
                            )}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 3. Completed Promotion Audit Log for This Session */}
      {sessionPromotionLogs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {pick('সম্পন্ন প্রমোশন ইতিহাস', 'Completed Promotion Log')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pick(
                  `${sourceYear?.name ?? ''} সেশন থেকে পরবর্তী শিক্ষাবর্ষে স্থানান্তরিত শিক্ষার্থীদের অডিট রেকর্ড।`,
                  `Audit record of students moved from session ${sourceYear?.name ?? ''}.`
                )}
              </p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(sessionPromotionLogs.length, locale)} {pick('টি রেকর্ড', 'records')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-surface-muted/70 border-b border-border text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="px-5 py-3">{pick('পূর্বের এনরোলমেন্ট', 'From')}</th>
                  <th className="px-5 py-3">{pick('নতুন এনরোলমেন্ট', 'To')}</th>
                  <th className="px-5 py-3">{pick('ধরন', 'Type')}</th>
                  <th className="px-5 py-3">{pick('তারিখ', 'Date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionPromotionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/students/${log.studentId}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {log.studentName}
                      </Link>
                      <span className="block text-xs font-mono text-muted-foreground">
                        {log.studentCode}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                      {log.fromLabel}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap tabular-nums">
                      {log.toLabel}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge enumName="PromotionType" value={log.promotionType} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatDateShort(log.promotionDate, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. Confirmation Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={pick('প্রমোশন নিশ্চিত করুন', 'Confirm Student Promotion')}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            {pick(
              `আপনি ${sourceYear?.name ?? ''} সেশনের ${classLabel(db, classId, locale)} থেকে মোট ${formatNumber(summary.selectedTotal, locale)} জন শিক্ষার্থীর সিদ্ধান্ত প্রয়োগ করতে যাচ্ছেন:`,
              `You are about to process ${summary.selectedTotal} student decisions from ${classLabel(db, classId, locale)} (${sourceYear?.name ?? ''}):`
            )}
          </p>

          <div className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/40 space-y-2 text-sm tabular-nums">
            {summary.promoteCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {pick('উত্তীর্ণ (Promoted)', 'Promoted')} →{' '}
                  {classLabel(db, nextClass?.id ?? '', locale)} ({targetYear?.name})
                </span>
                <strong className="text-primary">{formatNumber(summary.promoteCount, locale)}</strong>
              </div>
            )}
            {summary.retainCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {pick('একই শ্রেণিতে (Retained)', 'Retained')} →{' '}
                  {classLabel(db, classId, locale)} ({targetYear?.name})
                </span>
                <strong className="text-secondary">{formatNumber(summary.retainCount, locale)}</strong>
              </div>
            )}
            {summary.graduateCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {pick('এসএসসি সমাপ্ত (Graduated)', 'Graduated')}
                </span>
                <strong className="text-foreground">
                  {formatNumber(summary.graduateCount, locale)}
                </strong>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {pick(
              'নিশ্চিত করলে পূর্বের সেশনের এনরোলমেন্টগুলো ইতিহাস হিসেবে লক হয়ে যাবে এবং নতুন সেশনের সক্রিয় এনরোলমেন্ট তৈরি হবে।',
              'Once confirmed, previous session enrollments will be locked as history and active enrollments will be created in the target year.'
            )}
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isLoading}
            >
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={executePromotion}
              disabled={isLoading}
            >
              {isLoading
                ? pick('প্রক্রিয়া চলছে...', 'Processing...')
                : pick('নিশ্চিত ও প্রয়োগ করুন', 'Confirm & Apply')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
