'use client';

import React, { useState } from 'react';
import { UnifiedAdmissionForm, type AdminAdmissionResult } from '@/src/features/admission';
import { AdmissionConfirmationView } from './AdmissionConfirmationView';
import type { MockDatabase } from '@/src/mocks/seed';

export function StudentRegister({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const [admitted, setAdmitted] = useState<AdminAdmissionResult | null>(null);

  if (admitted) {
    return (
      <AdmissionConfirmationView
        db={db}
        result={admitted}
        onAdmitAnother={() => setAdmitted(null)}
      />
    );
  }

  return (
    <UnifiedAdmissionForm
      mode="admin"
      db={db}
      yearId={yearId}
      onAdminSuccess={(result) => setAdmitted(result)}
    />
  );
}
