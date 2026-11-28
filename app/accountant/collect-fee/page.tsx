'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CollectFeePage } from '@/src/features/accountant/components/CollectFeePage';

function CollectFeeRouteInner() {
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get('enrollmentId') ?? undefined;
  return <CollectFeePage initialEnrollmentId={enrollmentId} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CollectFeeRouteInner />
    </Suspense>
  );
}
