'use client';

import React, { Suspense } from 'react';
import {
  ExamsDirectoryView,
  ExamSubjectsConfigView,
} from './examinations/ExamsAndSubjectsView';
import { ExamRoutinesView } from './examinations/ExamRoutinesView';
import { ExamAdmitCardsView } from './examinations/ExamAdmitCardsView';
import { ExamSeatPlanView } from './examinations/ExamSeatPlanView';
import { MarksEntryView } from './examinations/MarksEntryView';
import { GradingScalesView } from './examinations/GradingScalesView';
import { ResultPublicationView } from './examinations/ResultPublicationView';
import { MeritAndMarksheetsView } from './examinations/MeritAndMarksheetsView';
import { ConsolidatedResultsView } from './examinations/ConsolidatedResultsView';

export type ExamModuleTab =
  | 'exams'
  | 'subjects'
  | 'routines'
  | 'admit-cards'
  | 'seat-plan'
  | 'marks'
  | 'grading'
  | 'publication'
  | 'merit'
  | 'consolidated';

/**
 * Clean sidebar-driven dispatcher for Examinations & Results routes.
 * Zero in-page tab duplication — navigation lives strictly in PortalLayout's Sidebar.
 */
export function AdminExamsAndResultsPage({
  defaultTab = 'exams',
  initialExamId,
  openCreateOnMount = false,
}: {
  defaultTab?: ExamModuleTab;
  initialExamId?: string;
  openCreateOnMount?: boolean;
}) {
  switch (defaultTab) {
    case 'subjects':
      return <ExamSubjectsConfigView initialExamId={initialExamId} />;
    case 'routines':
      return <ExamRoutinesView />;
    case 'admit-cards':
      return <ExamAdmitCardsView />;
    case 'seat-plan':
      return <ExamSeatPlanView />;
    case 'marks':
      return (
        <Suspense fallback={null}>
          <MarksEntryView />
        </Suspense>
      );
    case 'grading':
      return <GradingScalesView />;
    case 'publication':
      return <ResultPublicationView />;
    case 'merit':
      return <MeritAndMarksheetsView initialExamId={initialExamId} />;
    case 'consolidated':
      return <ConsolidatedResultsView />;
    case 'exams':
    default:
      return <ExamsDirectoryView openCreateOnMount={openCreateOnMount} />;
  }
}

export {
  ExamsDirectoryView,
  ExamSubjectsConfigView,
  ExamRoutinesView,
  ExamAdmitCardsView,
  ExamSeatPlanView,
  MarksEntryView,
  GradingScalesView,
  ResultPublicationView,
  MeritAndMarksheetsView,
  ConsolidatedResultsView,
};
