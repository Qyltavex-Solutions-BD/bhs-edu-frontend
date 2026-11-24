'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Achievement } from '@/src/types/entities';
import { AchievementType } from '@/src/types/enums';
import { useI18n } from '@/src/lib/i18n';
import { StarsMasonryAlbum } from '@/src/components/shared/StarsMasonryAlbum';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeStarsSectionProps {
  achievements: Achievement[];
}

export function HomeStarsSection({ achievements }: HomeStarsSectionProps) {
  const { locale, pick } = useI18n();

  const institutionStars = useMemo(() => {
    const publishedStars = (achievements ?? []).filter(
      (a) =>
        a.isPublished &&
        (a.type === AchievementType.STUDENT_STAR || a.type === AchievementType.NOTABLE_ALUMNI)
    );
    if (publishedStars.length >= 6) {
      return publishedStars.slice(0, 6);
    }
    const fallbacks = [
      {
        id: 'fallback-star-1',
        title:
          locale === 'bn'
            ? 'এসএসসি পরীক্ষায় গোল্ডেন জিপিএ ৫.০০ ও বোর্ড মেধা বৃত্তি'
            : 'Golden GPA-5 in SSC & Board Merit Scholarship',
        type: AchievementType.STUDENT_STAR,
        personName: locale === 'bn' ? 'তানভীর হাসান' : 'Tanvir Hasan',
        batch: locale === 'bn' ? 'ব্যাচ ২০২৪' : 'Batch 2024',
        description:
          locale === 'bn'
            ? 'ঢাকা শিক্ষা বোর্ডে মেধা তালিকায় স্থান অর্জন এবং নড়িয়া উপজেলায় বিজ্ঞান বিভাগে সর্বোচ্চ নম্বর প্রাপ্তি। বর্তমানে নটর ডেম কলেজে একাদশ শ্রেণিতে অধ্যয়নরত।'
            : 'Dhaka Education Board merit recipient and top scorer in science group across Naria Upazila.',
        image: '/images/teacher_kamrul_portrait_1795155721415.jpg',
        achievedAt: '2024-05-12',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-star-2',
        title:
          locale === 'bn'
            ? 'জাতীয় বিজ্ঞান অলিম্পিয়াড ও ইনোভেশন ফেয়ারে প্রথম স্থান'
            : 'Champion in National Science Olympiad & Innovation Fair',
        type: AchievementType.STUDENT_STAR,
        personName: locale === 'bn' ? 'সাদিয়া তাসনিম' : 'Sadia Tasnim',
        batch: locale === 'bn' ? 'ব্যাচ ২০২৫' : 'Batch 2025',
        description:
          locale === 'bn'
            ? 'স্মার্ট স্কুল এনার্জি ম্যানেজমেন্ট প্রকল্প উপস্থাপন করে জেলা পর্যায়ে প্রথম ও জাতীয় পর্যায়ে পদক অর্জন।'
            : 'Regional champion and national medalist for smart automated school energy management innovation.',
        image: '/images/teacher_sabina_portrait_1795155721585.jpg',
        achievedAt: '2025-09-18',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-1',
        title:
          locale === 'bn'
            ? 'অধ্যাপক ও গবেষক, বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)'
            : 'Professor & Researcher, BUET',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: locale === 'bn' ? 'ড. রফিকুল ইসলাম' : 'Dr. Rafiqul Islam',
        batch: locale === 'bn' ? 'ব্যাচ ১৯৯৬' : 'Batch 1996',
        description:
          locale === 'bn'
            ? 'নবায়নযোগ্য শক্তি প্রযুক্তিতে আন্তর্জাতিক গবেষক ও বিদ্যালয়ের আধুনিক বিজ্ঞান ল্যাব প্রতিষ্ঠার সম্মানিত পৃষ্ঠপোষক।'
            : 'International researcher in renewable energy and valued alumni patron for modernising school science facilities.',
        image: '/images/teacher_debashish_portrait_1795155721385.jpg',
        achievedAt: '2023-11-05',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-2',
        title:
          locale === 'bn'
            ? 'সিনিয়র সহকারী সচিব, জনপ্রশাসন মন্ত্রণালয় (৩৬তম বিসিএস)'
            : 'Senior Assistant Secretary, Ministry of Public Administration',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: locale === 'bn' ? 'ফারহানা ইয়াসমিন' : 'Farhana Yasmin',
        batch: locale === 'bn' ? 'ব্যাচ ২০০৬' : 'Batch 2006',
        description:
          locale === 'bn'
            ? '৩৬তম বিসিএস (প্রশাসন) ক্যাডারে কৃতিত্বের সাথে উত্তীর্ণ হয়ে নিষ্ঠার সাথে দেশসেবায় নিয়োজিত ও নারী শিক্ষার অনুপ্রেরণা।'
            : 'Ranked in 36th BCS Administration cadre, actively serving public administration and mentoring female scholars.',
        image: '/images/teacher_anupama_portrait_1795155720897.jpg',
        achievedAt: '2022-07-15',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-3',
        title:
          locale === 'bn'
            ? 'চিফ সফটওয়্যার আর্কিটেক্ট ও টেক এন্টারপ্রেনার'
            : 'Chief Software Architect & Tech Entrepreneur',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: locale === 'bn' ? 'মাহমুদুল হাসান' : 'Mahmudul Hasan',
        batch: locale === 'bn' ? 'ব্যাচ ২০০১' : 'Batch 2001',
        description:
          locale === 'bn'
            ? 'আন্তর্জাতিক ফিনটেক প্ল্যাটফর্মের শীর্ষ প্রকৌশলী এবং বিদ্যালয়ের আইসিটি ল্যাব ও শিক্ষার্থীদের কোডিং ক্লাবের নিয়মিত পৃষ্ঠপোষক।'
            : 'International fintech principal engineer and patron for BHS ICT lab & student coding workshops.',
        image: '/images/teacher_mahmudul_portrait_1795155721712.jpg',
        achievedAt: '2024-02-10',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-star-3',
        title:
          locale === 'bn'
            ? 'জাতীয় আন্তঃস্কুল বিতর্ক প্রতিযোগিতায় সেরা বক্তা ও চ্যাম্পিয়ন'
            : 'Best Speaker & Champion in National Inter-School Debate',
        type: AchievementType.STUDENT_STAR,
        personName: locale === 'bn' ? 'নুসরাত জাহান' : 'Nusrat Jahan',
        batch: locale === 'bn' ? 'ব্যাচ ২০২৩' : 'Batch 2023',
        description:
          locale === 'bn'
            ? 'জাতীয় টেলিভিশন বিতর্ক প্রতিযোগিতায় ঢাকা বিভাগের চ্যাম্পিয়ন এবং এসএসসিতে গোল্ডেন জিপিএ ৫.০০ প্রাপ্ত কৃতি শিক্ষার্থী।'
            : 'Dhaka division television debate champion and Golden GPA-5 recipient in SSC examination.',
        image: '/images/committee_rehana_portrait_1795170999363.jpg',
        achievedAt: '2023-08-20',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const combined = [...publishedStars];
    for (const fb of fallbacks) {
      if (combined.length >= 6) break;
      if (!combined.some((item) => item.id === fb.id || item.personName === fb.personName)) {
        combined.push(fb);
      }
    }
    return combined.slice(0, 6);
  }, [achievements, locale]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      <StarsMasonryAlbum
        stars={institutionStars}
        locale={locale}
        pick={pick}
      />
    </motion.section>
  );
}
