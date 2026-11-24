'use client';

import React from 'react';
import { ErrorState } from '@/src/components/shared/Feedback';

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? 'অপ্রত্যাশিত ত্রুটি হয়েছে' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <ErrorState
              message={this.state.message}
              onRetry={() => this.setState({ hasError: false, message: '' })}
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
