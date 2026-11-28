'use client';

import { DigitalResourcesPortalView } from '@/src/features/institution/components/DigitalResourcesPortalView';

export function TeacherResourcesPage() {
  return (
    <DigitalResourcesPortalView
      title="ডিজিটাল শিক্ষা রিসোর্স"
      description="শ্রেণিভিত্তিক লেকচার শিট, অনলাইন ক্লাস লিংক ও মাল্টিমিডিয়া কনটেন্ট"
      canManage
    />
  );
}
