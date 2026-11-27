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
      toast.error(errorMessage(err, 'কার্ড স্ক্যান ব্যর্থ হয়েছে'));
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
      toast.success('উপস্থিত হিসেবে চিহ্নিত হয়েছে');
    } catch (err) {
      toast.error(errorMessage(err, 'সংরক্ষণ ব্যর্থ হয়েছে'));
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
        `${res.saved} জন অনুপস্থিত চিহ্নিত এবং ${res.smsQueued}টি SMS পাঠানো হয়েছে`
      );
      setConfirmBatchOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'ব্যাচ অনুপস্থিত ব্যর্থ হয়েছে'));
    }
  }

  function exportScansCsv() {
    downloadCsv(
      `rfid-gate-scans-${date}-page-${feedPage}.csv`,
      [
        'কার্ড নম্বর',
        'শিক্ষার্থী',
        'শ্রেণি',
        'দিক',
        'অবস্থা',
        'ডিভাইস',
        'সময়',
      ],
      scanItems.map((s) => [
        s.cardNumber,
        s.studentName ?? 'অজানা',
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
                {'লাইভ RFID গেট রিডার মনিটর'}
              </div>
              <div className="text-sm text-muted-foreground">
                {`আজকের স্ক্যান: ${scansData?.stats.totalToday ?? 0} (পরিচিত: ${scansData?.stats.knownToday ?? 0}, অজানা: ${scansData?.stats.unknownToday ?? 0})`}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              placeholder={'RFID কার্ড নম্বর লিখুন (যেমন: RFID-1001)'}
              className="w-60 bg-card"
            />
            <Select
              value={punchDirection}
              onChange={(e) => setPunchDirection(e.target.value as 'ENTRY' | 'EXIT')}
              className="w-32 bg-card"
            >
              <option value="ENTRY">{'প্রবেশ (ENTRY)'}</option>
              <option value="EXIT">{'প্রস্থান (EXIT)'}</option>
            </Select>
            <Button type="submit" disabled={scanning || !cardInput.trim()}>
              {scanning ? 'স্ক্যান হচ্ছে...' : 'কার্ড পাঞ্চ করুন'}
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
          {`অচিহ্নিত / বাকি (${pendingData?.meta.total ?? 0})`}
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
          {'গেট স্ক্যান ফিড'}
        </button>
      </div>

      {subTab === 'pending' ? (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {'গেট পাঞ্চ বাকি থাকা শিক্ষার্থী'}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fetchingPending
                  ? 'লোড হচ্ছে...'
                  : 'ডিভাইস ত্রুটি বা কার্ড না আনলে ম্যানুয়ালি উপস্থিত দিন, অথবা দিনশেষে অনুপস্থিত ঘোষণা করুন'}
              </p>
            </div>
            {pendingItems.length > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setConfirmBatchOpen(true)}>
                <UserX className="h-4 w-4" />
                {`এই পাতার ${pendingItems.length} জনকে অনুপস্থিত + SMS`}
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
                placeholder={'নাম, রোল বা কার্ড খুঁজুন...'}
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
              <option value="">{'সব শ্রেণি'}</option>
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
              <option value="">{'সব শাখা'}</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
          </div>

          {pendingItems.length === 0 ? (
            <EmptyState
              title={'সব শিক্ষার্থীর হাজিরা সম্পন্ন'}
              description={'নির্বাচিত ফিল্টারে কোনো অচিহ্নিত শিক্ষার্থী বাকি নেই।'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{'রোল'}</th>
                    <th className="px-4 py-3">{'শিক্ষার্থী'}</th>
                    <th className="px-4 py-3">{'শ্রেণি ও শাখা'}</th>
                    <th className="px-4 py-3">{'RFID কার্ড'}</th>
                    <th className="px-4 py-3 text-right">{'দ্রুত অ্যাকশন'}</th>
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
                          <span className="text-warning">{'কার্ড নেই'}</span>
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
                          {'উপস্থিত (ম্যানুয়াল)'}
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
                {'গেট RFID স্ক্যান ফিড'}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fetchingScans ? 'লোড হচ্ছে...' : date}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={exportScansCsv}
              disabled={scanItems.length === 0}
            >
              <Download className="h-4 w-4" />
              {'CSV এক্সপোর্ট'}
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
                placeholder={'কার্ড নম্বর বা নাম খুঁজুন...'}
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
              <option value="ALL">{'সব দিক (ENTRY/EXIT)'}</option>
              <option value="ENTRY">{'প্রবেশ (ENTRY)'}</option>
              <option value="EXIT">{'প্রস্থান (EXIT)'}</option>
            </Select>
            <Select
              value={knownFilter}
              onChange={(e) => {
                setKnownFilter(e.target.value as typeof knownFilter);
                setFeedPage(1);
              }}
            >
              <option value="ALL">{'সব কার্ড'}</option>
              <option value="KNOWN">{'পরিচিত কার্ড'}</option>
              <option value="UNKNOWN">{'অজানা কার্ড'}</option>
            </Select>
          </div>

          {scanItems.length === 0 ? (
            <EmptyState
              title={'কোনো গেট স্ক্যান নেই'}
              description={'এই তারিখে কোনো RFID স্ক্যান লগ পাওয়া যায়নি।'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{'সময়'}</th>
                    <th className="px-4 py-3">{'কার্ড নম্বর'}</th>
                    <th className="px-4 py-3">{'শিক্ষার্থী ও শ্রেণি'}</th>
                    <th className="px-4 py-3">{'দিক'}</th>
                    <th className="px-4 py-3">{'ডিভাইস'}</th>
                    <th className="px-4 py-3">{'অবস্থা'}</th>
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
                            {'অনিবন্ধিত কার্ড'}
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
                            {'পরিচিত'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {'অজানা'}
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
        title={'ব্যাচ অনুপস্থিত নিশ্চিতকরণ'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-base text-muted-foreground">
            {`এই পাতার ${pendingItems.length} জন অচিহ্নিত শিক্ষার্থীকে অনুপস্থিত ঘোষণা করা হবে এবং অভিভাবকদের কাছে স্বয়ংক্রিয় SMS পাঠানো হবে।`}
          </p>
          <div className="flex justify-end gap-2 border-t border-border/70 pt-3">
            <Button variant="outline" onClick={() => setConfirmBatchOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button variant="destructive" disabled={savingBatch} onClick={markVisibleAbsent}>
              {savingBatch
                ? 'সংরক্ষণ হচ্ছে...'
                : 'নিশ্চিত করুন ও SMS পাঠান'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
