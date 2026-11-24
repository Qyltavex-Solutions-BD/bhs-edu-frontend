'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { X, Search, Award, ChevronDown, ArrowRight, LogIn, Sun, Moon } from 'lucide-react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';
import { PUBLIC_NAV, isGroupActive } from './public-nav.data';
import { cn } from '@/src/lib/utils/cn';

interface PublicMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  expandedGroup: string | null;
  onToggleGroup: (id: string) => void;
  onOpenSearch: () => void;
  pathname: string;
  portalUrl: string;
  isAuthenticated: boolean;
  theme: string;
  onToggleTheme: () => void;
  locale: string;
  pick: (bn: string, en: string) => string;
  t: (key: string) => string;
}

export function PublicMobileMenu({
  isOpen,
  onClose,
  expandedGroup,
  onToggleGroup,
  onOpenSearch,
  pathname,
  portalUrl,
  isAuthenticated,
  theme,
  onToggleTheme,
  locale,
  pick,
  t,
}: PublicMobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 lg:hidden bg-black/55 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-[320px] max-w-[88vw] h-full bg-surface text-foreground border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Brand Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2.5 min-w-0"
              >
                <SchoolEmblem size={34} />
                <div className="min-w-0 leading-tight">
                  <span className="block text-base font-bold text-primary truncate">
                    {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    BHS · {pick('স্থাপিত ১৯৭৮', 'Est. 1978')}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label={pick('মেনু বন্ধ করুন', 'Close menu')}
                className="p-1.5 rounded-[var(--radius)] hover:bg-surface-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Quick Search Trigger inside Drawer */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground bg-surface-muted/75 border border-border rounded-[var(--radius)] hover:text-foreground transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {pick('নোটিশ, ফলাফল বা শিক্ষক খুঁজুন...', 'Search notices, results, teachers...')}
                </span>
              </button>

              {/* Primary Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Link href="/results" onClick={onClose}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Award className="w-3.5 h-3.5" />
                    {t('nav.results')}
                  </Button>
                </Link>
                <Link href="/admission/apply" onClick={onClose}>
                  <Button variant="primary" size="sm" className="w-full">
                    {pick('ভর্তি আবেদন', 'Apply Now')}
                  </Button>
                </Link>
              </div>

              {/* Collapsible Accordion Navigation */}
              <nav className="divide-y divide-border/70 border-t border-b border-border/70">
                {PUBLIC_NAV.map((group) => {
                  const groupLabel = locale === 'bn' ? group.labelBn : group.labelEn;
                  const groupActive = isGroupActive(group, pathname);

                  if (!group.children) {
                    return (
                      <Link
                        key={group.id}
                        href={group.to!}
                        onClick={onClose}
                        className={cn(
                          'flex items-center justify-between py-3 text-sm font-semibold transition-colors',
                          groupActive
                            ? 'text-primary'
                            : 'text-foreground hover:text-primary'
                        )}
                      >
                        <span>{groupLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                      </Link>
                    );
                  }

                  const expanded = expandedGroup === group.id;
                  return (
                    <div key={group.id}>
                      <button
                        type="button"
                        onClick={() => onToggleGroup(group.id)}
                        aria-expanded={expanded}
                        className={cn(
                          'w-full flex items-center justify-between py-3 text-sm font-semibold transition-colors cursor-pointer',
                          groupActive || expanded
                            ? 'text-primary'
                            : 'text-foreground hover:text-primary'
                        )}
                      >
                        <span>{groupLabel}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 opacity-70 transition-transform duration-200',
                            expanded && 'rotate-180 opacity-100'
                          )}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="pb-3 pl-1 space-y-0.5">
                              {group.children.map((sub) => {
                                const SubIcon = sub.icon;
                                const subActive = pathname === sub.to;
                                return (
                                  <Link
                                    key={sub.to}
                                    href={sub.to}
                                    onClick={onClose}
                                    className={cn(
                                      'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-sm transition-colors',
                                      subActive
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-foreground/85 hover:bg-surface-muted hover:text-primary'
                                    )}
                                  >
                                    <SubIcon className="w-4 h-4 shrink-0 opacity-80" />
                                    <span>{locale === 'bn' ? sub.labelBn : sub.labelEn}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer Utility Bar */}
            <div className="p-4 border-t border-border bg-surface-muted/40 space-y-2.5 shrink-0">
              <Link href={portalUrl} onClick={onClose} className="block">
                <Button variant="secondary" className="w-full">
                  <LogIn className="w-4 h-4" />
                  {isAuthenticated ? t('nav.dashboard') : t('nav.portal')}
                </Button>
              </Link>
              <button
                type="button"
                onClick={onToggleTheme}
                className="h-9 w-full px-2.5 inline-flex items-center justify-center gap-1.5 text-sm font-medium border border-border bg-surface rounded-[var(--radius)] text-foreground hover:bg-surface-muted cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5" />
                    <span>{pick('লাইট মোড', 'Light')}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" />
                    <span>{pick('ডার্ক মোড', 'Dark')}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
