'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setCommandPaletteOpen } from '@/src/store/slices/uiSlice';
interface CommandItem {
  labelBn: string;
  labelEn: string;
  groupBn: string;
  groupEn: string;
  to: string;
}

const COMMANDS: CommandItem[] = [
  { labelBn: 'পাবলিক হোমপেজ', labelEn: 'Public School Homepage', groupBn: 'ওয়েবসাইট', groupEn: 'Public Site', to: '/' },
  { labelBn: 'অনলাইন ফলাফল অনুসন্ধান', labelEn: 'Public Result Search', groupBn: 'ওয়েবসাইট', groupEn: 'Public Site', to: '/results' },
  { labelBn: 'অনলাইন ভর্তি আবেদন (১৩-দফা)', labelEn: 'Online Admission Application', groupBn: 'ওয়েবসাইট', groupEn: 'Public Site', to: '/admission/apply' },
  { labelBn: 'নোটিশ বোর্ড', labelEn: 'Notice Board', groupBn: 'ওয়েবসাইট', groupEn: 'Public Site', to: '/notices' },
  { labelBn: 'ক্লাস ও পরীক্ষার রুটিন', labelEn: 'Class & Exam Routines', groupBn: 'ওয়েবসাইট', groupEn: 'Public Site', to: '/academics/routines' },
  { labelBn: 'অ্যাডমিন ড্যাশবোর্ড', labelEn: 'Admin Overview Dashboard', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin' },
  { labelBn: 'শিক্ষার্থী ডিরেক্টরি', labelEn: 'Student Directory', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin/students' },
  { labelBn: 'অনলাইন ভর্তি ইনবক্স', labelEn: 'Admissions Inbox', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin/students/admissions' },
  { labelBn: 'দৈনিক হাজিরা ও RFID', labelEn: 'Daily Attendance & RFID', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin/attendance/daily' },
  { labelBn: 'নম্বর এন্ট্রি শিট', labelEn: 'Exam Marks Entry', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin/examinations/marks-entry' },
  { labelBn: 'ফলাফল প্রক্রিয়াকরণ ও প্রকাশনা', labelEn: 'Result Processing & Publication', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin/results/publication' },
  { labelBn: 'ক্লাস রুটিন বিল্ডার', labelEn: 'Class Routine Builder', groupBn: 'অ্যাডমিন', groupEn: 'Admin', to: '/admin/academic/class-routines' },
  { labelBn: 'শিক্ষক পোর্টাল', labelEn: 'Teacher Portal', groupBn: 'পোর্টাল', groupEn: 'Portals', to: '/teacher/dashboard' },
  { labelBn: 'অভিভাবক পোর্টাল', labelEn: 'Parent Portal', groupBn: 'পোর্টাল', groupEn: 'Portals', to: '/parent/dashboard' },
  { labelBn: 'পোর্টাল লগইন', labelEn: 'Portal Login', groupBn: 'পোর্টাল', groupEn: 'Portals', to: '/login' },
];

export function CommandPalette() {
  const open = useAppSelector((s) => s.ui.commandPaletteOpen);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(!open));
      } else if (e.key === 'Escape' && open) {
        dispatch(setCommandPaletteOpen(false));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.labelBn.toLowerCase().includes(q) ||
        c.labelEn.toLowerCase().includes(q) ||
        c.to.toLowerCase().includes(q)
    );
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4"
      onClick={() => dispatch(setCommandPaletteOpen(false))}
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-[var(--radius)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'পৃষ্ঠা বা মডিউল খুঁজুন...'}
            className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="text-xs font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {'কোনো ফলাফল পাওয়া যায়নি'}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => {
                  dispatch(setCommandPaletteOpen(false));
                  setQuery('');
                  router.push(item.to);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.labelBn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.groupBn} · {item.to}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
