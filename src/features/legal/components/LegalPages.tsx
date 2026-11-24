'use client';

import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n';
import { PublicFaqView } from '@/src/components/public/PublicFaqView';
import { PageHeader } from '@/src/components/shared/Feedback';
import { Button, Card } from '@/src/components/ui/primitives';

export function LegalAndFaqPage({ mode }: { mode: 'privacy' | 'terms' | 'faq' }) {
  const { pick } = useI18n();

  if (mode === 'faq') {
    return <PublicFaqView />;
  }

  const title =
    mode === 'privacy'
      ? pick('গোপনীয়তা নীতি (Privacy Policy)', 'Privacy Policy')
      : pick('ব্যবহারের শর্তাবলি (Terms & Conditions)', 'Terms & Conditions');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader title={title} />
      <Card className="p-6 sm:p-8 space-y-4 text-base leading-relaxed text-foreground/90">
        {mode === 'privacy' && (
          <>
            <p>ভোজেশ্বর উচ্চ বিদ্যালয় শিক্ষার্থী ও অভিভাবকদের ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ।</p>
            <p>শিক্ষার্থীর জন্ম সনদ নম্বর, জাতীয় পরিচয়পত্র (NID), বাসার ঠিকানা এবং অভিভাবকের মোবাইল নম্বর কখনোই পাবলিক ওয়েবসাইটে প্রদর্শন করা হয় না। শুধুমাত্র প্রকাশিত পরীক্ষার ফলাফল, শ্রেণি, রোল ও অর্জিত গ্রেড পাবলিক ফলাফল পৃষ্ঠায় দেখা যায়।</p>
            <p>
              ক্যাম্পাসের অবস্থান প্রদর্শনের জন্য এই ওয়েবসাইটে Google Maps Platform ব্যবহৃত হয়েছে, যা{' '}
              <a
                href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Privacy Policy
              </a>
              -এর আওতাভুক্ত।
            </p>
          </>
        )}
        {mode === 'terms' && (
          <>
            <p>এই ডিজিটাল প্ল্যাটফর্মটি ভোজেশ্বর উচ্চ বিদ্যালয়ের একাডেমিক ও প্রশাসনিক কার্যক্রম পরিচালনার জন্য নির্মিত।</p>
            <p>অননুমোদিত প্রবেশ, তথ্য বিকৃতি বা অপব্যবহার বিদ্যালয় ও প্রচলিত আইনের পরিপন্থী।</p>
            <p>
              এই অ্যাপ্লিকেশনের মানচিত্র সেবা Google Maps Platform দ্বারা পরিচালিত এবং ব্যবহারকারীরা{' '}
              <a
                href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Maps/Google Earth Additional Terms of Service
              </a>{' '}
              ও{' '}
              <a
                href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Privacy Policy
              </a>
              -এর শর্তাবলির অধীন।
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  const { pick } = useI18n();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <p className="text-4xl font-bold text-primary tabular-nums">404</p>
        <h1 className="text-xl font-bold text-foreground">{pick('পৃষ্ঠাটি পাওয়া যায়নি', 'Page Not Found')}</h1>
        <p className="text-base text-muted-foreground">
          {pick('আপনি যে ঠিকানাটি খুঁজছেন তা বিদ্যমান নয় অথবা স্থানান্তরিত হয়েছে।', 'The page you requested does not exist or has been moved.')}
        </p>
        <Link href="/" className="inline-block">
          <Button variant="primary">{pick('হোমপেজে ফিরে যান', 'Return Home')}</Button>
        </Link>
      </Card>
    </div>
  );
}

