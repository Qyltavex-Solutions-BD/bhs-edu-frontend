'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Radio,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceMethod, AttendanceStatus } from '@/src/types/enums';
import { useI18n } from '@/src/lib/i18n';
import { EmptyState } from '@/src/components/shared/Feedback';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import type { SchoolClass, Section } from '@/src/types/entities';
import {
  useGetDailyAttendanceQuery,
  useGetRfidScansQuery,
  useSaveAttendanceBatchMutation,
  useSimulateRfidScanMutation,
} from '../api/attendance.api';
import { AttendancePagination } from './AttendancePagination';
import { downloadCsv, errorMessage, formatScanDateTime, ToneBadge } from './attendanceShared';

const PAGE_SIZE = 20;

export function GateMonitor({
  yearId,
  date,
  classes,
  sections,
}: {
  yearId: string;
  date: string;
  classes: SchoolClass[];
  sections: Section[];
}) {
  const { pick } = useI18n();
  const [subTab, setSubTab] = useState<'pending' | 'feed'>('pending');

  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [confirmBatchOpen, setConfirmBatchOpen] = useState(false);

  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [knownFilter, setKnownFilter] = useState<'ALL' | 'KNOWN' | 'UNKNOWN'>('ALL');
  const [feedSearch, setFeedSearch] = useState('');
  const [feedPage, setFeedPage] = useState(1);

  const [cardInput, setCardInput] = useState('');
  const [punchDirection, setPunchDirection] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  const availableSections = useMemo(
    () => (classId ? sections.filter((s) => s.classId === classId) : sections),
    [classId, sections]
  );

  const { data: pendingData, isFetching: fetchingPending } = useGetDailyAttendanceQuery({
    academicYearId: yearId,
    date,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    status: 'UNMARKED',
    search: pendingSearch.trim() || undefined,
    page: pendingPage,
    limit: PAGE_SIZE,
  });

  const { data: scansData, isFetching: fetchingScans } = useGetRfidScansQuery({
    date,
    direction: directionFilter,
    known: knownFilter,
    search: feedSearch.trim() || undefined,
    page: feedPage,
    limit: PAGE_SIZE,
  });

  const [saveBatch, { isLoading: savingBatch }] = useSaveAttendanceBatchMutation();
  const [simulateScan, { isLoading: scanning }] = useSimulateRfidScanMutation();

  const pendingItems = pendingData?.items ?? [];
  const scanItems = scansData?.items ?? [];

  async function handleSimulatePunch(e: React.FormEvent) {
    e.preventDefault();
    if (!cardInput.trim()) return;
    try {
      const res = await simulateScan({
        cardNumber: cardInput.trim(),
        direction: punchDirection,
        date,
      }).unwrap();
      if (res.isKnownCard) {
        toast.success(`${res.studentName ?? res.cardNumber} — ${res.message}`);
      } else {
        toast.warning(res.message);
      }
      setCardInput('');
    } catch (err) {
      toast.error(errorMessage(err, pick('কার্ড স্ক্যান ব্যর্থ হয়েছে', 'Scan failed')));
    }
  }

  async function markSinglePresent(studentEnrollmentId: string) {
    try {
      await saveBatch({
        date,
        academicYearId: yearId,
        entries: [
          {
            studentEnrollmentId,
            status: AttendanceStatus.PRESENT,
            method: AttendanceMethod.MANUAL,
          },
        ],
      }).unwrap();
      toast.success(pick('উপস্থিত হিসেবে চিহ্নিত হয়েছে', 'Marked present'));
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ ব্যর্থ হয়েছে', 'Failed to mark')));
    }
  }

  async function markVisibleAbsent() {
    if (pendingItems.length === 0) return;
    try {
      const res = await saveBatch({
        date,
        academicYearId: yearId,
        entries: pendingItems.map((item) => ({
          studentEnrollmentId: item.studentEnrollmentId,
          status: AttendanceStatus.ABSENT,
          method: AttendanceMethod.MANUAL,
        })),
      }).unwrap();
      toast.success(
        pick(
          `${res.saved} জন অনুপস্থিত চিহ্নিত এবং ${res.smsQueued}টি SMS পাঠানো হয়েছে`,
          `${res.saved} marked absent, ${res.smsQueued} SMS queued`
        )
      );
      setConfirmBatchOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('ব্যাচ অনুপস্থিত ব্যর্থ হয়েছে', 'Batch absent failed')));
    }
  }

  function exportScansCsv() {
    downloadCsv(
      `rfid-gate-scans-${date}-page-${feedPage}.csv`,
      [
        pick('কার্ড নম্বর', 'Card Number'),
        pick('শিক্ষার্থী', 'Student'),
        pick('শ্রেণি', 'Class'),
        pick('দিক', 'Direction'),
        pick('অবস্থা', 'Known'),
        pick('ডিভাইস', 'Device'),
        pick('সময়', 'Scanned At'),
      ],
      scanItems.map((s) => [
        s.cardNumber,
        s.studentName ?? pick('অজানা', 'Unknown'),
        s.className ?? '—',
        s.direction,
        s.isKnownCard ? 'KNOWN' : 'UNKNOWN',
        s.deviceLocation,
        s.scannedAt,
      ])
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/25 bg-primary/5 p-4">
        <form
          onSubmit={handleSimulatePunch}
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-primary" />
            <div>
              <div className="text-base font-semibold text-foreground">
                {pick('লাইভ RFID গেট রিডার মনিটর', 'Live RFID Gate Reader Monitor')}
              </div>
              <div className="text-sm text-muted-foreground">
                {pick(
                  `আজকের স্ক্যান: ${scansData?.stats.totalToday ?? 0} (পরিচিত: ${scansData?.stats.knownToday ?? 0}, অজানা: ${scansData?.stats.unknownToday ?? 0})`,
                  `Today's scans: ${scansData?.stats.totalToday ?? 0} (Known: ${scansData?.stats.knownToday ?? 0}, Unknown: ${scansData?.stats.unknownToday ?? 0})`
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              placeholder={pick('RFID কার্ড নম্বর লিখুন (যেমন: RFID-1001)', 'Enter RFID card number')}
              className="w-60 bg-card"
            />
            <Select
              value={punchDirection}
              onChange={(e) => setPunchDirection(e.target.value as 'ENTRY' | 'EXIT')}
              className="w-32 bg-card"
            >
              <option value="ENTRY">{pick('প্রবেশ (ENTRY)', 'ENTRY')}</option>
              <option value="EXIT">{pick('প্রস্থান (EXIT)', 'EXIT')}</option>
            </Select>
            <Button type="submit" disabled={scanning || !cardInput.trim()}>
              {scanning ? pick('স্ক্যান হচ্ছে...', 'Scanning...') : pick('কার্ড পাঞ্চ করুন', 'Punch Card')}
            </Button>
          </div>
        </form>
      </Card>

      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setSubTab('pending')}
          className={`rounded-lg px-4 py-2 text-base font-semibold transition ${
            subTab === 'pending'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {pick(
            `অচিহ্নিত / বাকি (${pendingData?.meta.total ?? 0})`,
            `Pending / Unmarked (${pendingData?.meta.total ?? 0})`
          )}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('feed')}
          className={`rounded-lg px-4 py-2 text-base font-semibold transition ${
            subTab === 'feed'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {pick('গেট স্ক্যান ফিড', 'Gate Scan Feed')}
        </button>
      </div>

      {subTab === 'pending' ? (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {pick('গেট পাঞ্চ বাকি থাকা শিক্ষার্থী', 'Students Not Yet Scanned')}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fetchingPending
                  ? pick('লোড হচ্ছে...', 'Loading...')
                  : pick(
                      'ডিভাইস ত্রুটি বা কার্ড না আনলে ম্যানুয়ালি উপস্থিত দিন, অথবা দিনশেষে অনুপস্থিত ঘোষণা করুন',
                      'Manually mark present on device fault or finalize absent with SMS'
                    )}
              </p>
            </div>
            {pendingItems.length > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setConfirmBatchOpen(true)}>
                <UserX className="h-4 w-4" />
                {pick(
                  `এই পাতার ${pendingItems.length} জনকে অনুপস্থিত + SMS`,
                  `Mark ${pendingItems.length} Absent + SMS`
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-border/70 px-5 py-3.5 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={pendingSearch}
                onChange={(e) => {
                  setPendingSearch(e.target.value);
                  setPendingPage(1);
                }}
                placeholder={pick('নাম, রোল বা কার্ড খুঁজুন...', 'Search name, roll, card...')}
                className="pl-9"
              />
            </div>
            <Select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId('');
                setPendingPage(1);
              }}
            >
              <option value="">{pick('সব শ্রেণি', 'All Classes')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn || cls.name}
                </option>
              ))}
            </Select>
            <Select
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value);
                setPendingPage(1);
              }}
            >
              <option value="">{pick('সব শাখা', 'All Sections')}</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
          </div>

          {pendingItems.length === 0 ? (
            <EmptyState
              title={pick('সব শিক্ষার্থীর হাজিরা সম্পন্ন', 'All students accounted for')}
              description={pick(
                'নির্বাচিত ফিল্টারে কোনো অচিহ্নিত শিক্ষার্থী বাকি নেই।',
                'No unmarked students remain for the current filters.'
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{pick('রোল', 'Roll')}</th>
                    <th className="px-4 py-3">{pick('শিক্ষার্থী', 'Student')}</th>
                    <th className="px-4 py-3">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                    <th className="px-4 py-3">{pick('RFID কার্ড', 'RFID Card')}</th>
                    <th className="px-4 py-3 text-right">{pick('দ্রুত অ্যাকশন', 'Quick Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pendingItems.map((item) => (
                    <tr key={item.studentEnrollmentId} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-semibold">{item.roll}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {item.nameBn || item.nameEn}
                        </div>
                        <div className="font-mono text-sm text-muted-foreground">
                          {item.studentCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.className} ({item.sectionName})
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {item.rfidCardNumber ?? (
                          <span className="text-warning">{pick('কার্ড নেই', 'No card')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingBatch}
                          onClick={() => markSinglePresent(item.studentEnrollmentId)}
                        >
                          <UserCheck className="h-3.5 w-3.5 text-success" />
                          {pick('উপস্থিত (ম্যানুয়াল)', 'Mark Present')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AttendancePagination meta={pendingData?.meta} onPageChange={setPendingPage} />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {pick('গেট RFID স্ক্যান ফিড', 'RFID Gate Punch Feed')}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fetchingScans ? pick('লোড হচ্ছে...', 'Loading...') : date}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={exportScansCsv}
              disabled={scanItems.length === 0}
            >
              <Download className="h-4 w-4" />
              {pick('CSV এক্সপোর্ট', 'Export CSV')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-border/70 px-5 py-3.5 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={feedSearch}
                onChange={(e) => {
                  setFeedSearch(e.target.value);
                  setFeedPage(1);
                }}
                placeholder={pick('কার্ড নম্বর বা নাম খুঁজুন...', 'Search card or student...')}
                className="pl-9"
              />
            </div>
            <Select
              value={directionFilter}
              onChange={(e) => {
                setDirectionFilter(e.target.value as typeof directionFilter);
                setFeedPage(1);
              }}
            >
              <option value="ALL">{pick('সব দিক (ENTRY/EXIT)', 'All Directions')}</option>
              <option value="ENTRY">{pick('প্রবেশ (ENTRY)', 'ENTRY')}</option>
              <option value="EXIT">{pick('প্রস্থান (EXIT)', 'EXIT')}</option>
            </Select>
            <Select
              value={knownFilter}
              onChange={(e) => {
                setKnownFilter(e.target.value as typeof knownFilter);
                setFeedPage(1);
              }}
            >
              <option value="ALL">{pick('সব কার্ড', 'All Cards')}</option>
              <option value="KNOWN">{pick('পরিচিত কার্ড', 'Known Cards')}</option>
              <option value="UNKNOWN">{pick('অজানা কার্ড', 'Unknown Cards')}</option>
            </Select>
          </div>

          {scanItems.length === 0 ? (
            <EmptyState
              title={pick('কোনো গেট স্ক্যান নেই', 'No gate scans found')}
              description={pick(
                'এই তারিখে কোনো RFID স্ক্যান লগ পাওয়া যায়নি।',
                'No RFID punch logs recorded for this date.'
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{pick('সময়', 'Time')}</th>
                    <th className="px-4 py-3">{pick('কার্ড নম্বর', 'Card Number')}</th>
                    <th className="px-4 py-3">{pick('শিক্ষার্থী ও শ্রেণি', 'Student & Class')}</th>
                    <th className="px-4 py-3">{pick('দিক', 'Direction')}</th>
                    <th className="px-4 py-3">{pick('ডিভাইস', 'Device')}</th>
                    <th className="px-4 py-3">{pick('অবস্থা', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scanItems.map((scan) => (
                    <tr key={scan.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatScanDateTime(scan.scannedAt)}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{scan.cardNumber}</td>
                      <td className="px-4 py-3">
                        {scan.studentName ? (
                          <>
                            <div className="font-semibold text-foreground">{scan.studentName}</div>
                            <div className="text-sm text-muted-foreground">{scan.className}</div>
                          </>
                        ) : (
                          <span className="text-sm text-destructive">
                            {pick('অনিবন্ধিত কার্ড', 'Unregistered Card')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ToneBadge tone={scan.direction === 'ENTRY' ? 'success' : 'info'}>
                          {scan.direction}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {scan.deviceLocation}
                      </td>
                      <td className="px-4 py-3">
                        {scan.isKnownCard ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {pick('পরিচিত', 'Known')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {pick('অজানা', 'Unknown')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AttendancePagination meta={scansData?.meta} onPageChange={setFeedPage} />
        </Card>
      )}

      <Modal
        open={confirmBatchOpen}
        onClose={() => setConfirmBatchOpen(false)}
        title={pick('ব্যাচ অনুপস্থিত নিশ্চিতকরণ', 'Confirm Batch Absent & SMS')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-base text-muted-foreground">
            {pick(
              `এই পাতার ${pendingItems.length} জন অচিহ্নিত শিক্ষার্থীকে অনুপস্থিত ঘোষণা করা হবে এবং অভিভাবকদের কাছে স্বয়ংক্রিয় SMS পাঠানো হবে।`,
              `${pendingItems.length} unmarked students on this page will be marked absent and guardian SMS alerts will be queued.`
            )}
          </p>
          <div className="flex justify-end gap-2 border-t border-border/70 pt-3">
            <Button variant="outline" onClick={() => setConfirmBatchOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button variant="destructive" disabled={savingBatch} onClick={markVisibleAbsent}>
              {savingBatch
                ? pick('সংরক্ষণ হচ্ছে...', 'Processing...')
                : pick('নিশ্চিত করুন ও SMS পাঠান', 'Confirm & Send SMS')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
