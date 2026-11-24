'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useAppSelector } from '@/src/store/hooks';

export function ClientToaster() {
  const [mounted, setMounted] = useState(false);
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <Toaster richColors position="top-right" theme={theme} />;
}
