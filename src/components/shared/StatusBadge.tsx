'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  MinusCircle,
} from 'lucide-react';
import { getEnumMeta, type SemanticTone } from '@/src/lib/constants/enums';
import { useI18n } from '@/src/lib/i18n';
import { cn } from '@/src/lib/utils/cn';

/**
 * Status is NEVER conveyed by color alone — always renders a semantic icon + localized text label.
 */
export function StatusBadge({
  enumName,
  value,
  customLabel,
  customTone,
  className,
}: {
  enumName?: string;
  value: string;
  customLabel?: string;
  customTone?: SemanticTone;
  className?: string;
}) {
  const { locale } = useI18n();
  const meta = enumName ? getEnumMeta(enumName, value) : null;
  const label = customLabel ?? (meta ? (locale === 'bn' ? meta.bn : meta.en) : value);
  const tone: SemanticTone = customTone ?? meta?.tone ?? 'neutral';

  const toneStyles: Record<SemanticTone, string> = {
    success: 'text-success bg-success/10 border-success/25',
    destructive: 'text-destructive bg-destructive/10 border-destructive/25',
    warning: 'text-warning bg-warning/10 border-warning/25',
    info: 'text-info bg-info/10 border-info/25',
    primary: 'text-primary bg-primary/10 border-primary/25',
    neutral: 'text-muted-foreground bg-surface-muted border-border',
  };

  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'destructive'
        ? XCircle
        : tone === 'warning'
          ? AlertTriangle
          : tone === 'info'
            ? Info
            : tone === 'primary'
              ? Clock
              : MinusCircle;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0',
        toneStyles[tone],
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
