'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '@/src/lib/utils/cn';
import { formatDateShort } from '@/src/lib/formatters';
import type { AppNotification } from '@/src/types/proposed/future';

interface PortalNotificationMenuProps {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onMarkRead: (args: { id?: string }) => void;
}

export function PortalNotificationMenu({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onMarkRead,
  
  
}: PortalNotificationMenuProps) {
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Notifications"
        className="relative h-10 w-10 inline-flex items-center justify-center bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs text-foreground cursor-pointer transition"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#DF6153] text-white text-xs font-bold flex items-center justify-center tabular-nums leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">
              {'নোটিফিকেশন'}
            </span>
            <button
              type="button"
              onClick={() => onMarkRead({})}
              className="text-sm font-medium text-primary hover:underline cursor-pointer"
            >
              {'সব পঠিত করুন'}
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                {'কোনো নতুন নোটিফিকেশন নেই'}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onMarkRead({ id: n.id });
                    onToggle();
                    if (n.link) router.push(n.link);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors cursor-pointer',
                    !n.isRead && 'bg-primary/5'
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {n.titleBn}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {n.bodyBn}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                    {formatDateShort(n.createdAt, ('bn'))}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
