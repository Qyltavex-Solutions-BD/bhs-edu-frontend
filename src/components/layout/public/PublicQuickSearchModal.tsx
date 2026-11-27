'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, Megaphone, ArrowUpRight, ArrowRight, type LucideIcon } from 'lucide-react';
import type { Notice } from '@/src/types/entities';

export interface PublicSearchResultItem {
  shortcuts: {
    labelBn: string;
    labelEn: string;
    descBn: string;
    descEn: string;
    to: string;
    icon: LucideIcon;
  }[];
  notices: Notice[];
  staff: { id: string; name: string; designation: string }[];
  academics: { id: string; label: string; meta: string; to: string }[];
}

interface PublicQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: PublicSearchResultItem;
  hasAnySearchResult: boolean;
  onNavigate: (to: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function PublicQuickSearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  hasAnySearchResult,
  onNavigate,
  searchInputRef,
  
  
}: PublicQuickSearchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={'দ্রুত অনুসন্ধান'}
            className="w-full max-w-xl bg-surface text-foreground border border-border rounded-[var(--radius)] shadow-2xl overflow-hidden"
          >
            {/* Search Input Row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={'নোটিশ, শিক্ষক, শ্রেণি, বিষয় বা ফলাফল খুঁজুন...'}
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {'মুছুন'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={'বন্ধ করুন'}
                className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results Body */}
            <div className="max-h-[68vh] overflow-y-auto p-3 space-y-4">
              {!hasAnySearchResult ? (
                <div className="py-10 text-center space-y-1">
                  <p className="text-base font-medium text-foreground">
                    {'কোনো তথ্য পাওয়া যায়নি'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {'অন্য কোনো শব্দ লিখে চেষ্টা করুন (যেমন: ফলাফল, ভর্তি, রুটিন, নোটিশ)'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Quick Shortcuts */}
                  {searchResults.shortcuts.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-sm font-semibold text-muted-foreground">
                        {searchQuery
                          ? 'দ্রুত লিংক'
                          : 'জনপ্রিয় সেবাসমূহ'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {searchResults.shortcuts.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.to}
                              type="button"
                              onClick={() => onNavigate(item.to)}
                              className="flex items-center gap-2.5 p-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                            >
                              <span className="h-8 w-8 rounded-lg bg-surface-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors">
                                <Icon className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-foreground group-hover:text-primary truncate">
                                  {item.labelBn}
                                </span>
                                <span className="block text-sm text-muted-foreground truncate">
                                  {item.descBn}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matching Notices */}
                  {searchResults.notices.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-sm font-semibold text-muted-foreground">
                        {searchQuery
                          ? 'বিজ্ঞপ্তি ও নোটিশ'
                          : 'সর্বশেষ বিজ্ঞপ্তি'}
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.notices.map((notice) => (
                          <button
                            key={notice.id}
                            type="button"
                            onClick={() => onNavigate(`/notices/${notice.id}`)}
                            className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Megaphone className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                                {notice.title}
                              </span>
                              {notice.isUrgent && (
                                <span className="px-2 py-0.5 rounded bg-[#C81E24] text-white text-xs font-semibold leading-none shrink-0">
                                  {'জরুরি'}
                                </span>
                              )}
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Staff */}
                  {searchResults.staff.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-sm font-semibold text-muted-foreground">
                        {'শিক্ষকমণ্ডলী ও কর্মচারী'}
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.staff.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => onNavigate('/about/teachers')}
                            className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate">
                                {person.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {person.designation}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Classes & Subjects */}
                  {searchResults.academics.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-sm font-semibold text-muted-foreground">
                        {'শ্রেণি ও পাঠ্যবিষয়'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {searchResults.academics.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => onNavigate(entry.to)}
                            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground group-hover:text-primary truncate">
                                {entry.label}
                              </span>
                              <span className="block text-sm text-muted-foreground">
                                {entry.meta}
                              </span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Search Footer Hint */}
            <div className="px-4 py-2.5 border-t border-border bg-surface-muted/50 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {'ভোজেশ্বর উচ্চ বিদ্যালয় · দ্রুত নেভিগেশন'}
              </span>
              <span className="hidden sm:inline font-mono text-sm">ESC</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
