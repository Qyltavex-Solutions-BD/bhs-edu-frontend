'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  dismissSessionExpired,
  logout,
  type AppRole,
} from '@/src/store/slices/authSlice';
import { setCommandPaletteOpen, toggleSidebar, toggleTheme } from '@/src/store/slices/uiSlice';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Modal } from '@/src/components/ui/primitives';
import {
  type PortalKind,
  getPortalNavGroups,
  getCurrentNavContext,
  PortalStudentDisabledScreen,
  PortalLoginRequiredScreen,
  PortalSidebar,
  PortalMobileDrawer,
  PortalHeader,
} from './portal';

export type { PortalKind };

export function PortalLayout({ portal, children }: { portal: PortalKind; children: React.ReactNode }) {
  const { locale, pick } = useI18n();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAppSelector((s) => s.auth);
  const { sidebarCollapsed, theme, enableFutureModules, enableStudentPortal } = useAppSelector((s) => s.ui);
  const { data: db } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const expectedRoles: Record<PortalKind, AppRole[]> = {
    admin: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
    teacher: ['TEACHER'],
    parent: ['PARENT'],
    student: ['STUDENT'],
  };

  const navGroups = useMemo(
    () => getPortalNavGroups(portal, enableFutureModules),
    [portal, enableFutureModules]
  );

  const roleNotifications = useMemo(() => {
    const list = db?.notifications ?? [];
    if (!auth.role) return list;
    return list.filter((n) => n.targetRoles.includes(auth.role!));
  }, [db?.notifications, auth.role]);

  const unreadCount = roleNotifications.filter((n) => !n.isRead).length;

  const isDashboardRoot = useMemo(() => {
    return (
      pathname === '/admin' ||
      pathname === '/teacher' ||
      pathname === '/teacher/dashboard' ||
      pathname === '/parent' ||
      pathname === '/parent/dashboard' ||
      pathname === '/student' ||
      pathname === '/student/dashboard'
    );
  }, [pathname]);

  const currentNavContext = useMemo(
    () => getCurrentNavContext(portal, pathname, locale, pick),
    [portal, pathname, locale, pick]
  );

  // Student Portal Feature Flag Gate
  if (portal === 'student' && !enableStudentPortal) {
    return <PortalStudentDisabledScreen pick={pick} />;
  }

  if (!auth.isAuthenticated || !auth.role || !expectedRoles[portal].includes(auth.role)) {
    return <PortalLoginRequiredScreen pick={pick} />;
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleToggleMenu = (to: string) => {
    setOpenMenus((prev) => ({ ...prev, [to]: !prev[to] }));
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-background text-foreground">
      {/* Desktop Floating Green Capsule Sidebar */}
      <PortalSidebar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => dispatch(toggleSidebar())}
        navGroups={navGroups}
        pathname={pathname}
        openMenus={openMenus}
        onToggleMenu={handleToggleMenu}
        user={auth.user}
        onLogout={handleLogout}
        locale={locale}
        pick={pick}
      />

      {/* Mobile Sidebar Drawer */}
      <PortalMobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navGroups={navGroups}
        pathname={pathname}
        openMenus={openMenus}
        onToggleMenu={handleToggleMenu}
        onLogout={handleLogout}
        locale={locale}
        pick={pick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto">
        {/* Top Bar Header */}
        <PortalHeader
          onOpenMobileNav={() => setMobileOpen(true)}
          isDashboardRoot={isDashboardRoot}
          portal={portal}
          currentNavContext={currentNavContext}
          user={auth.user}
          role={auth.role}
          onOpenSearch={() => dispatch(setCommandPaletteOpen(true))}
          notifications={roleNotifications}
          unreadCount={unreadCount}
          notifOpen={notifOpen}
          onToggleNotif={() => setNotifOpen((v) => !v)}
          onMarkNotificationRead={(args) => markRead(args)}
          theme={theme}
          onToggleTheme={() => dispatch(toggleTheme())}
          locale={locale}
          pick={pick}
        />

        {/* Page Viewport */}
        <main className="flex-1 px-4 sm:px-6 pt-4 sm:pt-5 pb-6 w-full space-y-6">
          {children}
        </main>
      </div>

      {/* Session Expired Modal */}
      <Modal
        open={auth.sessionExpired}
        onClose={() => dispatch(dismissSessionExpired())}
        title={pick('সেশনের মেয়াদ শেষ হয়েছে', 'Session Expired')}
        maxWidth="max-w-md"
      >
        <p className="text-base text-muted-foreground">
          {pick(
            'নিরাপত্তার কারণে আপনার সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।',
            'Your session has expired for security reasons. Please sign in again.'
          )}
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button
            variant="primary"
            onClick={handleLogout}
          >
            {pick('পুনরায় লগইন', 'Sign In Again')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
