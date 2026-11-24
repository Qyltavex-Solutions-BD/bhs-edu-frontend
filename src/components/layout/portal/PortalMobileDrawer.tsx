'use client';

import React from 'react';
import Link from 'next/link';
import { X, LogOut, ChevronDown } from 'lucide-react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';
import { studentChildActive, type NavGroup } from './portal-nav.data';
import { cn } from '@/src/lib/utils/cn';

interface PortalMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navGroups: NavGroup[];
  pathname: string;
  openMenus: Record<string, boolean>;
  onToggleMenu: (to: string) => void;
  onLogout: () => void;
  locale: string;
  pick: (bn: string, en: string) => string;
}

export function PortalMobileDrawer({
  isOpen,
  onClose,
  navGroups,
  pathname,
  openMenus,
  onToggleMenu,
  onLogout,
  locale,
  pick,
}: PortalMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-72 max-w-[85vw] h-full bg-gradient-to-b from-[#185536] via-[#1C6440] to-[#14492E] text-white border-r border-white/10 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Translucent Bubble Overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-[#2D8B59]/40 via-[#1C6440]/20 to-transparent blur-2xl" />
          <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full border border-white/[0.12] bg-white/[0.04]" />
          <div className="absolute top-[40%] -left-16 w-52 h-52 rounded-full bg-gradient-to-tr from-[#247A4D]/35 via-[#1C6440]/15 to-transparent blur-xl" />
          <div className="absolute top-[42%] -left-10 w-40 h-40 rounded-full border border-white/[0.08]" />
          <div className="absolute bottom-16 -right-12 w-44 h-44 rounded-full bg-gradient-to-tl from-[#34A870]/30 to-transparent blur-2xl" />
        </div>

        {/* Drawer Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <SchoolEmblem size={28} />
            <span className="text-sm font-bold text-white truncate">
              {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3.5 scrollbar-thin relative z-10">
          {navGroups.map((group) => (
            <div key={group.id}>
              {group.labelEn && (
                <p className="px-3 pt-3.5 pb-1.5 text-xs sm:text-[13px] font-bold text-white uppercase tracking-wider">
                  {locale === 'bn' ? group.labelBn : group.labelEn}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selfActive = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const showChildren = Boolean(item.children?.length);

                  if (!showChildren) {
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-150',
                          selfActive
                            ? 'bg-white text-[#1C6440] font-bold shadow-xs'
                            : 'text-white/95 hover:text-white hover:bg-white/10'
                        )}
                      >
                        <Icon className={cn('w-4.5 h-4.5 shrink-0', selfActive ? 'text-[#1C6440]' : 'text-white/90')} />
                        <span className="truncate flex-1">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#DF6153] text-white leading-none shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  const open = openMenus[item.to] ?? selfActive;
                  return (
                    <div key={item.to}>
                      <button
                        type="button"
                        onClick={() => onToggleMenu(item.to)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer',
                          selfActive
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-white/95 hover:text-white hover:bg-white/10'
                        )}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0 text-white/90" />
                        <span className="truncate flex-1 text-left">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                        {item.badge && (
                          <span className="mr-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-[#DF6153] text-white leading-none shrink-0">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform opacity-75', open && 'rotate-180')} />
                      </button>
                      {open && (
                        <div className="mt-1 ml-3 pl-2.5 border-l border-white/20 space-y-0.5">
                          {item.children!.map((child) => {
                            const childActive = studentChildActive(pathname, child.to);
                            return (
                              <Link
                                key={child.to}
                                href={child.to}
                                onClick={onClose}
                                className={cn(
                                  'block px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                  childActive
                                    ? 'bg-white text-[#1C6440] font-bold shadow-xs'
                                    : 'text-white/85 hover:text-white hover:bg-white/10'
                                )}
                              >
                                {locale === 'bn' ? child.labelBn : child.labelEn}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-white/10 relative z-10">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut className="w-4 h-4" />
            {pick('লগ আউট', 'Sign Out')}
          </Button>
        </div>
      </div>
    </div>
  );
}
