'use client';

import React from 'react';
import { PageHeader } from '@/src/components/shared/Feedback';

export function ParentsShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
