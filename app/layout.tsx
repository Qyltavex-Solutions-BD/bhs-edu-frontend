import type { Metadata } from 'next';
import { Hind_Siliguri, Inter } from 'next/font/google';
import { Suspense } from 'react';
import { Providers } from '@/src/components/Providers';
import '@/src/index.css';

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ভোজেশ্বর উচ্চ বিদ্যালয় | Bhojeshwar High School (BHS)',
  description:
    'ভোজেশ্বর উচ্চ বিদ্যালয় (স্থাপিত ১৯৭৮, EIIN: 113587), ভোজেশ্বর, নড়িয়া, শরীয়তপুর — আধুনিক স্কুল ম্যানেজমেন্ট ও ডিজিটাল শিক্ষা প্ল্যাটফর্ম।',
  icons: {
    icon: '/assets/aistudio/15f910cc-7969-442c-abd0-8fbf9bc3081d_9580ab1b.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${hind.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
