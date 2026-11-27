'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronDown, LogOut } from 'lucide-react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { studentChildActive, type NavGroup } from './portal-nav.data';
import { cn } from '@/src/lib/utils/cn';
import type { AuthUser } from '@/src/store/slices/authSlice';

interface PortalSidebarProps {
  portal: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  navGroups: NavGroup[];
  pathname: string;
  openMenus: Record<string, boolean>;
  onToggleMenu: (to: string) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

export function PortalSidebar({
  portal,
  sidebarCollapsed,
  onToggleSidebar,
  navGroups,
  pathname,
  openMenus,
  onToggleMenu,
  user,
  onLogout,
  
  
}: PortalSidebarProps) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-gradient-to-b from-[#185536] via-[#1C6440] to-[#14492E] text-white shrink-0 my-3 ml-3 lg:ml-4 rounded-3xl shadow-xl border border-white/10 h-[calc(100vh-1.5rem)] no-print z-40 transition-all duration-200 overflow-hidden relative',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Decorative Translucent Bubble Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#2D8B59]/40 via-[#1C6440]/20 to-transparent blur-2xl" />
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-[1px]" />
        <div className="absolute top-2 -right-2 w-28 h-28 rounded-full border border-white/[0.08]" />

        <div className="absolute top-[35%] -left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-[#247A4D]/35 via-[#1C6440]/15 to-transparent blur-xl" />
        <div className="absolute top-[38%] -left-14 w-48 h-48 rounded-full border border-white/[0.08] bg-white/[0.03]" />
        <div className="absolute top-[42%] -left-4 w-32 h-32 rounded-full border border-white/[0.06]" />

        <div className="absolute bottom-28 -right-16 w-56 h-56 rounded-full bg-gradient-to-tl from-[#34A870]/30 via-[#1C6440]/15 to-transparent blur-2xl" />
        <div className="absolute bottom-32 -right-10 w-44 h-44 rounded-full border border-white/[0.12] bg-white/[0.04]" />

        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 256 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="220" cy="110" r="140" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="220" cy="110" r="95" stroke="white" strokeWidth="1.2" />
          <circle cx="20" cy="420" r="120" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="20" cy="420" r="80" stroke="white" strokeWidth="1" />
          <circle cx="210" cy="650" r="130" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Top Header Inside Sidebar */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          </button>
          {!sidebarCollapsed && (
            <Link href="/" className="min-w-0 flex items-center gap-2">
              <SchoolEmblem size={28} />
              <div className="min-w-0 leading-tight">
                <span className="text-sm font-bold text-white tracking-tight truncate block">
                  {'ভোজেশ্বর উচ্চ বিদ্যালয়'}
                </span>
                <span className="text-sm text-white/80 truncate block">
                  EIIN: 113587 · Admin
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Sidebar Links Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3.5 portal-sidebar-scroll relative z-10">
        {navGroups.map((group, groupIdx) => (
          <div
            key={group.id}
            className={cn(
              groupIdx > 0 && sidebarCollapsed ? 'pt-2 border-t border-white/10' : ''
            )}
          >
            {group.labelEn && !sidebarCollapsed && (
              <p className="px-3 pt-3.5 pb-1.5 text-sm font-bold text-white uppercase tracking-wider">
                {group.labelBn}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const selfActive = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
                const showChildren = Boolean(item.children?.length) && !sidebarCollapsed;

                if (!showChildren) {
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-150',
                        selfActive
                          ? 'bg-white text-[#1C6440] font-bold shadow-xs'
                          : 'text-white/95 hover:text-white hover:bg-white/10',
                        sidebarCollapsed ? 'justify-center px-2' : ''
                      )}
                      title={sidebarCollapsed ? (item.labelBn) : undefined}
                    >
                      <Icon className={cn('w-4.5 h-4.5 shrink-0', selfActive ? 'text-[#1C6440]' : 'text-white/90')} />
                      {!sidebarCollapsed && (
                        <span className="truncate flex-1">{item.labelBn}</span>
                      )}
                      {item.badge && !sidebarCollapsed && (
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
                      <span className="truncate flex-1 text-left">{item.labelBn}</span>
                      {item.badge && (
                        <span className="mr-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-[#DF6153] text-white leading-none shrink-0">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform opacity-75', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <div className="mt-1 ml-3.5 pl-3 border-l-2 border-white/80 space-y-0.5">
                        {item.children!.map((child) => {
                          const childActive = studentChildActive(pathname, child.to);
                          return (
                            <Link
                              key={child.to}
                              href={child.to}
                              className={cn(
                                'block px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                childActive
                                  ? 'bg-white text-[#1C6440] font-bold shadow-xs'
                                  : 'text-white/90 hover:text-white hover:bg-white/10'
                              )}
                            >
                              {child.labelBn}
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

      {/* Full-width Clickable Logout Section at Bottom */}
      <div className="px-3 pb-3 pt-1 shrink-0 relative z-10">
        <button
          type="button"
          onClick={onLogout}
          title={'লগআউট'}
          aria-label={'লগআউট'}
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-[#DF6153]/85 border border-white/15 text-white text-base font-semibold transition cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {!sidebarCollapsed && <span>{'লগআউট'}</span>}
        </button>
      </div>
    </aside>
  );
}
