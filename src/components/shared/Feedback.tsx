'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Inbox, RefreshCw, Info } from 'lucide-react';
import { Button, Card, Modal, Skeleton } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import { cn } from '@/src/lib/utils/cn';

/**
 * Generated high-resolution institutional photography assets stored locally in /images/.
 * Automatically copied into dist/src/assets/ on production builds.
 */
export const SCHOOL_LOGO_SRC =
  '/assets/aistudio/15f910cc-7969-442c-abd0-8fbf9bc3081d_9580ab1b.jpg';

export const CAMPUS_PHOTOS: Record<
  string,
  { src: string; altBn: string; altEn: string; fallbackBg: string }
> = {
  'campus-heritage': {
    src: '/images/hero_campus_heritage_1795136893336.jpg',
    altBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়ের ঐতিহ্যবাহী ক্যাম্পাস প্রাঙ্গণ',
    altEn: 'Campus courtyard of Bhojeshwar High School',
    fallbackBg: '#1E293B',
  },
  'digital-classroom': {
    src: '/images/hero_smart_classroom_1795136908001.jpg',
    altBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়ের মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ',
    altEn: 'Interactive digital smart classroom session at BHS',
    fallbackBg: '#1E293B',
  },
  'science-lab': {
    src: '/images/hero_science_lab_1795136893284.jpg',
    altBn: 'সুসজ্জিত বিজ্ঞান ও আইসিটি গবেষণাগার',
    altEn: 'Equipped high school science and ICT laboratory',
    fallbackBg: '#1E293B',
  },
  'library-room': {
    src: '/images/hero_library_reading_1795136892122.jpg',
    altBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়ের সমৃদ্ধ পাঠাগার ও অধ্যয়ন কক্ষ',
    altEn: 'Sunlit school library and reading room',
    fallbackBg: '#1E293B',
  },
  'sports-day': {
    src: '/images/hero_sports_campus_1795136944347.jpg',
    altBn: 'বিদ্যালয়ের সবুজ খেলার মাঠ ও বার্ষিক ক্রীড়া অনুষ্ঠান',
    altEn: 'Green campus sports field and athletic assembly',
    fallbackBg: '#1E293B',
  },
  'heritage-building': {
    src: '/images/history_campus_gate_1795172237816.jpg',
    altBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়ের ঐতিহ্যবাহী মূল একাডেমিক ভবন ও প্রাঙ্গণ',
    altEn: 'Historic main academic building and tree-lined courtyard of Bhojeshwar High School',
    fallbackBg: '#1E293B',
  },
  'morning-assembly': {
    src: '/images/history_morning_assembly_1795172238766.jpg',
    altBn: 'বিদ্যালয় প্রাঙ্গণে প্রাত্যহিক সমাবেশ ও জাতীয় পতাকা উত্তোলন',
    altEn: 'Morning school assembly and national flag courtyard',
    fallbackBg: '#1E293B',
  },
  'debate-hall': {
    src: '/images/history_cocurricular_debate_1795172238917.jpg',
    altBn: 'আন্তঃশ্রেণি বিতর্ক, সাহিত্য ও সহশিক্ষা সাংস্কৃতিক অনুষ্ঠান',
    altEn: 'Inter-class debate, literary, and cultural program in the school hall',
    fallbackBg: '#1E293B',
  },
};

export function getCampusPhoto(variant?: string | null) {
  if (variant && CAMPUS_PHOTOS[variant]) {
    return CAMPUS_PHOTOS[variant];
  }
  if (
    variant &&
    (variant.startsWith('/') ||
      variant.startsWith('http://') ||
      variant.startsWith('https://') ||
      variant.startsWith('data:'))
  ) {
    return {
      src: variant,
      altBn: 'ভোজেশ্বর উচ্চ বিদ্যালয় গ্যালারি ছবি',
      altEn: 'Bhojeshwar High School gallery photo',
      fallbackBg: '#1E293B',
    };
  }
  return CAMPUS_PHOTOS['campus-heritage'];
}

export const LEADERSHIP_PORTRAITS = {
  PRINCIPAL: '/images/headteacher_clean_portrait_1795154685112.jpg',
  CHAIRMAN: '/images/chairman_portrait_1795154662402.jpg',
} as const;

export function getLeadershipPortrait(photo?: string | null, type?: string | null): string {
  if (photo && (photo.startsWith('/') || photo.startsWith('http') || photo.startsWith('data:'))) {
    return photo;
  }
  if (type === 'CHAIRMAN') return LEADERSHIP_PORTRAITS.CHAIRMAN;
  return LEADERSHIP_PORTRAITS.PRINCIPAL;
}

export const STAFF_PORTRAITS = {
  headteacher: '/images/headteacher_clean_portrait_1795154685112.jpg',
  anupama: '/images/teacher_anupama_portrait_1795155720897.jpg',
  kamrul: '/images/teacher_kamrul_portrait_1795155721415.jpg',
  sabina: '/images/teacher_sabina_portrait_1795155721585.jpg',
  debashish: '/images/teacher_debashish_portrait_1795155721385.jpg',
  mahmudul: '/images/teacher_mahmudul_portrait_1795155721712.jpg',
} as const;

export function getStaffPortrait(
  photo?: string | null,
  gender?: string | null,
  staffId?: string | null
): string {
  if (photo && (photo.startsWith('/') || photo.startsWith('http') || photo.startsWith('data:'))) {
    return photo;
  }
  const byId: Record<string, string> = {
    'staff-1': STAFF_PORTRAITS.headteacher,
    'staff-2': STAFF_PORTRAITS.anupama,
    'staff-3': STAFF_PORTRAITS.kamrul,
    'staff-4': STAFF_PORTRAITS.sabina,
    'staff-5': STAFF_PORTRAITS.debashish,
    'staff-6': STAFF_PORTRAITS.anupama,
    'staff-7': STAFF_PORTRAITS.mahmudul,
    'staff-8': STAFF_PORTRAITS.kamrul,
    'staff-9': STAFF_PORTRAITS.sabina,
    'staff-10': STAFF_PORTRAITS.mahmudul,
    'staff-11': STAFF_PORTRAITS.debashish,
    'staff-12': STAFF_PORTRAITS.kamrul,
    'staff-13': STAFF_PORTRAITS.kamrul,
    'staff-14': STAFF_PORTRAITS.sabina,
    'staff-15': STAFF_PORTRAITS.kamrul,
  };
  if (staffId && byId[staffId]) return byId[staffId];
  if (gender === 'FEMALE') return STAFF_PORTRAITS.sabina;
  return STAFF_PORTRAITS.kamrul;
}

export const COMMITTEE_PORTRAITS = {
  chairman: LEADERSHIP_PORTRAITS.CHAIRMAN,
  headteacher: LEADERSHIP_PORTRAITS.PRINCIPAL,
  subrata: '/images/committee_subrata_portrait_1795171029609.jpg',
  habibur: '/images/committee_habibur_portrait_1795170999277.jpg',
  rehana: '/images/committee_rehana_portrait_1795170999363.jpg',
} as const;

export function getCommitteePortrait(
  photo?: string | null,
  memberId?: string | null,
  designation?: string | null
): string {
  if (photo && (photo.startsWith('/') || photo.startsWith('http') || photo.startsWith('data:'))) {
    return photo;
  }
  const byId: Record<string, string> = {
    'mc-1': COMMITTEE_PORTRAITS.chairman,
    'mc-2': COMMITTEE_PORTRAITS.headteacher,
    'mc-3': COMMITTEE_PORTRAITS.subrata,
    'mc-4': COMMITTEE_PORTRAITS.habibur,
    'mc-5': COMMITTEE_PORTRAITS.rehana,
  };
  if (memberId && byId[memberId]) return byId[memberId];
  const desig = (designation ?? '').toLowerCase();
  if (desig.includes('সভাপতি') || desig.includes('chairman')) return COMMITTEE_PORTRAITS.chairman;
  if (desig.includes('প্রধান শিক্ষক') || desig.includes('সদস্য সচিব') || desig.includes('secretary')) {
    return COMMITTEE_PORTRAITS.headteacher;
  }
  if (desig.includes('মহিলা') || desig.includes('female') || desig.includes('women')) {
    return COMMITTEE_PORTRAITS.rehana;
  }
  return COMMITTEE_PORTRAITS.habibur;
}

export const NEWS_PHOTOS = {
  scienceFair: '/images/news_science_fair_1795157433625.jpg',
  treePlantation: '/images/news_tree_plantation_1795157433367.jpg',
  debateLibrary: '/images/hero_library_reading_1795136892122.jpg',
  sportsField: '/images/hero_sports_campus_1795136944347.jpg',
  campusHeritage: '/images/hero_campus_heritage_1795136893336.jpg',
} as const;

export function getNewsPhoto(image?: string | null, itemId?: string | null): string {
  if (image && (image.startsWith('/') || image.startsWith('http') || image.startsWith('data:'))) {
    return image;
  }
  if (image && CAMPUS_PHOTOS[image]) {
    return CAMPUS_PHOTOS[image].src;
  }
  const byId: Record<string, string> = {
    'news-1': NEWS_PHOTOS.scienceFair,
    'news-2': NEWS_PHOTOS.treePlantation,
    'news-3': NEWS_PHOTOS.debateLibrary,
    'ev-1': NEWS_PHOTOS.campusHeritage,
    'ev-2': NEWS_PHOTOS.sportsField,
    'ev-3': NEWS_PHOTOS.scienceFair,
  };
  if (itemId && byId[itemId]) return byId[itemId];
  return NEWS_PHOTOS.campusHeritage;
}

export function SchoolEmblem({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={SCHOOL_LOGO_SRC}
      alt="ভোজেশ্বর উচ্চ বিদ্যালয় (BHS) মনোগ্রাম"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={cn(
        'object-contain rounded-full bg-white p-0.5 ring-1 ring-border shrink-0',
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Renders high-resolution local campus photography with resilient gradient fallback,
 * smooth hover zoom, and optional measured contrast scrim caption overlay.
 */
export function InstitutionalArtwork({
  variant = 'campus-heritage',
  title,
  subtitle,
  className,
  interactive = true,
}: {
  variant?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  interactive?: boolean;
}) {
  const { locale } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);
  const photo = getCampusPhoto(variant);

  useEffect(() => {
    setImgFailed(false);
  }, [photo.src]);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius)] flex items-end select-none',
        className
      )}
      style={{ backgroundColor: photo.fallbackBg }}
    >
      {!imgFailed ? (
        <img
          src={photo.src}
          alt={locale === 'bn' ? photo.altBn : photo.altEn}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            interactive && 'transition-transform duration-500 ease-out group-hover:scale-105'
          )}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-slate-800"
        />
      )}

      {(title || subtitle) && (
        <div className="relative z-10 w-full p-5 bg-gradient-to-t from-slate-950/88 via-slate-950/35 to-transparent text-white">
          {title && <p className="text-base font-semibold leading-snug">{title}</p>}
          {subtitle && <p className="text-sm text-white/80 mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  titleBn,
  titleEn,
  subtitleBn,
  subtitleEn,
  actions,
}: {
  title?: string;
  description?: string;
  titleBn?: string;
  titleEn?: string;
  subtitleBn?: string;
  subtitleEn?: string;
  actions?: React.ReactNode;
}) {
  const { locale } = useI18n();
  const resolvedTitle = title ?? (locale === 'bn' ? titleBn || titleEn || '' : titleEn || titleBn || '');
  const resolvedDescription =
    description ?? (locale === 'bn' ? subtitleBn || subtitleEn : subtitleEn || subtitleBn);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {resolvedTitle}
        </h1>
        {resolvedDescription && (
          <p className="text-base text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            {resolvedDescription}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  meta,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  meta?: string;
  accent?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
}) {
  const valueTone =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'success'
        ? 'text-success'
        : accent === 'warning'
          ? 'text-warning'
          : accent === 'destructive'
            ? 'text-destructive'
            : 'text-foreground';

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold text-foreground">{label}</span>
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      </div>
      <div className={cn('text-2xl sm:text-3xl font-extrabold tabular-nums mt-2 tracking-tight', valueTone)}>{value}</div>
      {meta && <span className="text-sm text-muted-foreground mt-1.5">{meta}</span>}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-border rounded-[var(--radius)] bg-surface">
      <Inbox className="w-8 h-8 text-muted-foreground mb-3" />
      <h3 className="text-base font-semibold text-foreground">{title ?? t('status.empty')}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-destructive/30 rounded-[var(--radius)] bg-destructive/5">
      <AlertCircle className="w-8 h-8 text-destructive mb-3" />
      <h3 className="text-base font-semibold text-foreground">{t('status.error')}</h3>
      {message && <p className="text-sm text-muted-foreground mt-1.5 max-w-md">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('status.retry')}
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {t('cta.cancel')}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel ?? t('cta.submit')}
        </Button>
      </div>
    </Modal>
  );
}

export const ConfirmDialog = ConfirmationDialog;
