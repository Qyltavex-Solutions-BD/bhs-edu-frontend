'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';

export function OfflineBanner() {
  const { pick } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="bg-warning text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 no-print">
      <WifiOff className="w-4 h-4" />
      <span>
        {pick('ইন্টারনেট সংযোগ বিচ্ছিন্ন। সংযোগ ফিরে এলে পরিবর্তনগুলো পুনরায় সিঙ্ক করুন।')}
      </span>
    </div>
  );
}
