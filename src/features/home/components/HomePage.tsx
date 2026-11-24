'use client';

import React, { useState } from 'react';
import { useGetPublicNoticesQuery } from '@/src/features/notices/api/notices.api';
import { useGetBootstrapQuery } from '@/src/store/api';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { NoticeDocumentModal } from '@/src/components/shared/NoticeDocumentViewer';
import type { Notice } from '@/src/types/entities';

import { HomeHeroSection } from './HomeHeroSection';
import { HomeNoticeSection } from './HomeNoticeSection';
import { HomeAdmissionBanner } from './HomeAdmissionBanner';
import { HomeCampusLifeSection } from './HomeCampusLifeSection';
import { HomeFacultySection } from './HomeFacultySection';
import { HomeStarsSection } from './HomeStarsSection';
import { HomeNewsSection } from './HomeNewsSection';
import { HomeContactMapSection } from './HomeContactMapSection';

export function HomePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { data: noticePage, isError: noticesError, isLoading: loadingNotices, refetch: refetchNotices } = useGetPublicNoticesQuery({ limit: 20 });
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);

  if (isLoading || !db) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-24 pb-12">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  const presidentMsg =
    db.leadershipMessages.find((m) => m.type === 'CHAIRMAN' && m.isPublished) ||
    db.leadershipMessages[1];
  const principalMsg =
    db.leadershipMessages.find((m) => m.type === 'PRINCIPAL' && m.isPublished) ||
    db.leadershipMessages[0];

  return (
    <div className="space-y-16 pb-10">
      <HomeHeroSection db={db} notices={noticePage?.items ?? []} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-20">
        <HomeNoticeSection
          notices={noticePage?.items ?? []}
          loading={loadingNotices}
          loadFailed={noticesError}
          onRetry={() => void refetchNotices()}
          presidentMsg={presidentMsg}
          principalMsg={principalMsg}
          onPreviewNotice={setPreviewNotice}
        />

        <HomeAdmissionBanner admissionContent={db.admissionContent} />

        <HomeCampusLifeSection
          galleries={db.galleries}
          galleryMedia={db.galleryMedia}
        />

        <HomeFacultySection
          staff={db.staff}
          departments={db.departments}
        />

        <HomeStarsSection achievements={db.achievements} />

        <HomeNewsSection news={db.news} />

        <HomeContactMapSection
          schoolName={db.schoolProfile.name}
          contactInfo={db.contactInfo}
        />
      </div>

      <NoticeDocumentModal
        notice={previewNotice}
        school={db.schoolProfile}
        onClose={() => setPreviewNotice(null)}
      />
    </div>
  );
}
