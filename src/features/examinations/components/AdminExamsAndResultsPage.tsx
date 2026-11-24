'use client';

import React, { Suspense } from 'react';
import {
  ExamsDirectoryView,
  ExamSubjectsConfigView,
} from './ExamsAndSubjectsView';
import { ExamRoutinesView } from './ExamRoutinesView';
import { ExamAdmitCardsView } from './ExamAdmitCardsView';
import { ExamSeatPlanView } from './ExamSeatPlanView';
import { MarksEntryView } from './MarksEntryView';
import { GradingScalesView } from './GradingScalesView';
import { ResultPublicationView } from './ResultPublicationView';
import { MeritAndMarksheetsView } from './MeritAndMarksheetsView';
import { ConsolidatedResultsView } from './ConsolidatedResultsView';

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
      return <MarksEntryView />;
    case 'grading':
      return <GradingScalesView />;
    case 'publication':
      return <ResultPublicationView />;
    case 'merit':
      return <MeritAndMarksheetsView />;
    case 'consolidated':
      return <ConsolidatedResultsView />;
    case 'exams':
    default:
      return (
        <ExamsDirectoryView
          openCreateOnMount={openCreateOnMount}
        />
      );
  }
}
