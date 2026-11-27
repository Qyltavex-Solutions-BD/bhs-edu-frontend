import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from '@/src/components/Providers';
import '@/src/index.css';

export const metadata: Metadata = {
  title: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  description:
    'ভোজেশ্বর উচ্চ বিদ্যালয় (স্থাপিত ১৯৭৮, EIIN: 113587), ভোজেশ্বর, নড়িয়া, শরীয়তপুর — আধুনিক স্কুল ম্যানেজমেন্ট ও ডিজিটাল শিক্ষা প্ল্যাটফর্ম।',
  icons: {
    icon: '/assets/aistudio/15f910cc-7969-442c-abd0-8fbf9bc3081d_9580ab1b.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      className="font-sans"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Tiro+Bangla:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
