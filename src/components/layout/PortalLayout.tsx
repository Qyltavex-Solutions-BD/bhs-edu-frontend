'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  dismissSessionExpired,
  logout,
  type AppRole,
} from '@/src/store/slices/authSlice';
import { setCommandPaletteOpen, toggleSidebar, toggleTheme } from '@/src/store/slices/uiSlice';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useLogoutUserMutation } from '@/src/features/auth/api/auth.api';
import { Button, Modal } from '@/src/components/ui/primitives';
import {
  type PortalKind,
  getPortalNavGroups,
  getCurrentNavContext,
  PortalStudentDisabledScreen,
  PortalSidebar,
  PortalMobileDrawer,
  PortalHeader,
} from './portal';

export type { PortalKind };

export function PortalLayout({ portal, children }: { portal: PortalKind; children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAppSelector((s) => s.auth);
  const { sidebarCollapsed, theme, enableFutureModules, enableStudentPortal } = useAppSelector((s) => s.ui);
  const { data: db } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [logoutApi] = useLogoutUserMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const expectedRoles: Record<PortalKind, AppRole[]> = {
    admin: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
    accountant: ['ACCOUNTANT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
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
      pathname === '/accountant' ||
      pathname === '/accountant/dashboard' ||
      pathname === '/teacher' ||
      pathname === '/teacher/dashboard' ||
      pathname === '/parent' ||
      pathname === '/parent/dashboard' ||
      pathname === '/student' ||
      pathname === '/student/dashboard'
    );
  }, [pathname]);

  const currentNavContext = useMemo(
    () => getCurrentNavContext(portal, pathname, 'bn', (bn: string) => bn),
    [portal, pathname]
  );

  const isAllowedRole = Boolean(auth.role && expectedRoles[portal].includes(auth.role));
  const isAuthorized = auth.isHydrated && auth.isAuthenticated && isAllowedRole;

  useEffect(() => {
    if (!auth.isHydrated) return;
    if (portal === 'student' && !enableStudentPortal) return;

    if (!auth.isAuthenticated || !auth.role) {
      router.replace(portal === 'accountant' ? '/accountant/login' : '/login');
      return;
    }

    if (!isAllowedRole) {
      router.replace('/unauthorized');
    }
  }, [auth.isHydrated, auth.isAuthenticated, auth.role, isAllowedRole, portal, enableStudentPortal, router]);

  // Student Portal Feature Flag Gate
  if (portal === 'student' && !enableStudentPortal) {
    return <PortalStudentDisabledScreen />;
  }

  if (!mounted || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Clear local session even if backend is unreachable
    }
    dispatch(logout());
    router.replace(portal === 'accountant' ? '/accountant/login' : '/login');
  };

  const handleToggleMenu = (to: string) => {
    setOpenMenus((prev) => ({ ...prev, [to]: !prev[to] }));
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-background text-foreground">
      {/* Desktop Floating Green Capsule Sidebar */}
      <PortalSidebar
        portal={portal}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => dispatch(toggleSidebar())}
        navGroups={navGroups}
        pathname={pathname}
        openMenus={openMenus}
        onToggleMenu={handleToggleMenu}
        user={auth.user}
        onLogout={handleLogout}
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto [scrollbar-gutter:stable]">
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
          onLogout={handleLogout}
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
        title={'সেশনের মেয়াদ শেষ হয়েছে'}
        maxWidth="max-w-md"
      >
        <p className="text-base text-muted-foreground">
          {'নিরাপত্তার কারণে আপনার সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।'}
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button
            variant="primary"
            onClick={handleLogout}
          >
            {'পুনরায় লগইন'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
