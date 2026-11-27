'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  Paperclip,
  Printer,
  Search,
  ExternalLink,
  Download,
  Eye,
  FileText,
  Film,
  GraduationCap,
  Maximize2,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MasonryPhotoAlbum } from 'react-photo-album';

import { useGetBootstrapQuery } from '@/src/store/api';
import { formatDateLong, formatDateShort, formatNumber } from '@/src/lib/formatters';
import {
  EmptyState,
  getCampusPhoto,
  getNewsPhoto,
  InstitutionalArtwork,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { SchoolCampusMap } from '@/src/components/shared/SchoolCampusMap';
import { PublicFaqView } from '@/src/components/public/PublicFaqView';
import {
  NoticeDocumentModal,
  NoticeDocumentViewer,
  downloadNoticeDocument,
} from '@/src/components/shared/NoticeDocumentViewer';
import { ChromePdfViewer } from '@/src/components/shared/ChromePdfViewer';
import { Button, Card, FormField, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { AchievementType, MediaType, NoticeStatus, PublicationType } from '@/src/types/enums';
import type { Achievement, Notice } from '@/src/types/entities';
import { cn } from '@/src/lib/utils/cn';

type NoticeTab = 'all' | 'urgent' | 'exam' | 'admission';

export function PublicContactPage() {
  const { data: db } = useGetBootstrapQuery();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) {
      toast.error('অনুগ্রহ করে নাম ও বার্তা লিখুন।');
      return;
    }
    toast.success(
      'আপনার বার্তা গ্রহণ করা হয়েছে। (দ্রষ্টব্য: ইনবক্স ব্যাকএন্ড সংযোজনের পর সংরক্ষিত হবে)'
    );
    setName('');
    setPhone('');
    setMsg('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader title={'যোগাযোগ'} description={db?.contactInfo.address} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">{'বিদ্যালয় অফিস'}</h2>
          <p className="flex items-start gap-2.5 text-base text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
            <span>{db?.contactInfo.address}</span>
          </p>
          <p className="flex items-center gap-2.5 text-base text-muted-foreground tabular-nums">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <span>{db?.contactInfo.phone}</span>
          </p>
          <p className="flex items-center gap-2.5 text-base text-muted-foreground">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <span>{db?.contactInfo.email}</span>
          </p>
          <p className="text-sm text-muted-foreground pt-3 border-t border-border">
            {'অফিস সময়: রবিবার – বৃহস্পতিবার, সকাল ১০:০০ থেকে বিকাল ৪:০০ (শুক্রবার ও শনিবার সাপ্তাহিক ছুটি)।'}
          </p>
          {db?.contactInfo.mapUrl && (
            <a
              href={db.contactInfo.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {'গুগল ম্যাপে অবস্থান দেখুন'}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </Card>

        <Card className="lg:col-span-7 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">{'বার্তা পাঠান'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={'আপনার নাম'} required>
                <Input placeholder="আপনার নাম লিখুন" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label={'মোবাইল নম্বর'}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017XXXXXXXX" />
              </FormField>
            </div>
            <FormField label={'আপনার বার্তা'} required>
              <Textarea placeholder="আপনার বার্তা লিখুন..." value={msg} onChange={(e) => setMsg(e.target.value)} />
            </FormField>
            <Button type="submit" variant="primary">{'বার্তা পাঠান'}</Button>
          </form>
        </Card>
      </div>

      {/* Interactive Google Maps Platform Campus Location */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {'গুগল ম্যাপে বিদ্যালয়ের অবস্থান'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {'ভোজেশ্বর উচ্চ বিদ্যালয়, নড়িয়া, শরীয়তপুর — মানচিত্রে অবস্থান দেখুন ও দিকনির্দেশনা নিন।'}
          </p>
        </div>
        <SchoolCampusMap
          schoolName={db?.schoolProfile.name}
          address={db?.contactInfo.address}
          phone={db?.contactInfo.phone}
          fallbackMapUrl={db?.contactInfo.mapUrl}
          heightClassName="h-[340px] sm:h-[400px]"
        />
      </section>
    </div>
  );
}

