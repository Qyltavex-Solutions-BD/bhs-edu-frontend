'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Achievement } from '@/src/types/entities';
import { AchievementType } from '@/src/types/enums';
import { StarsMasonryAlbum } from '@/src/components/shared/StarsMasonryAlbum';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeStarsSectionProps {
  achievements: Achievement[];
}

export function HomeStarsSection({ achievements }: HomeStarsSectionProps) {
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
          'এসএসসি পরীক্ষায় গোল্ডেন জিপিএ ৫.০০ ও বোর্ড মেধা বৃত্তি',
        type: AchievementType.STUDENT_STAR,
        personName: 'তানভীর হাসান',
        batch: 'ব্যাচ ২০২৪',
        description:
          'ঢাকা শিক্ষা বোর্ডে মেধা তালিকায় স্থান অর্জন এবং নড়িয়া উপজেলায় বিজ্ঞান বিভাগে সর্বোচ্চ নম্বর প্রাপ্তি। বর্তমানে নটর ডেম কলেজে একাদশ শ্রেণিতে অধ্যয়নরত।',
        image: '/images/teacher_kamrul_portrait_1795155721415.jpg',
        achievedAt: '2024-05-12',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-star-2',
        title:
          'জাতীয় বিজ্ঞান অলিম্পিয়াড ও ইনোভেশন ফেয়ারে প্রথম স্থান',
        type: AchievementType.STUDENT_STAR,
        personName: 'সাদিয়া তাসনিম',
        batch: 'ব্যাচ ২০২৫',
        description:
          'স্মার্ট স্কুল এনার্জি ম্যানেজমেন্ট প্রকল্প উপস্থাপন করে জেলা পর্যায়ে প্রথম ও জাতীয় পর্যায়ে পদক অর্জন।',
        image: '/images/teacher_sabina_portrait_1795155721585.jpg',
        achievedAt: '2025-09-18',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-1',
        title:
          'অধ্যাপক ও গবেষক, বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: 'ড. রফিকুল ইসলাম',
        batch: 'ব্যাচ ১৯৯৬',
        description:
          'নবায়নযোগ্য শক্তি প্রযুক্তিতে আন্তর্জাতিক গবেষক ও বিদ্যালয়ের আধুনিক বিজ্ঞান ল্যাব প্রতিষ্ঠার সম্মানিত পৃষ্ঠপোষক।',
        image: '/images/teacher_debashish_portrait_1795155721385.jpg',
        achievedAt: '2023-11-05',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-2',
        title:
          'সিনিয়র সহকারী সচিব, জনপ্রশাসন মন্ত্রণালয় (৩৬তম বিসিএস)',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: 'ফারহানা ইয়াসমিন',
        batch: 'ব্যাচ ২০০৬',
        description:
          '৩৬তম বিসিএস (প্রশাসন) ক্যাডারে কৃতিত্বের সাথে উত্তীর্ণ হয়ে নিষ্ঠার সাথে দেশসেবায় নিয়োজিত ও নারী শিক্ষার অনুপ্রেরণা।',
        image: '/images/teacher_anupama_portrait_1795155720897.jpg',
        achievedAt: '2022-07-15',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-3',
        title:
          'চিফ সফটওয়্যার আর্কিটেক্ট ও টেক এন্টারপ্রেনার',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: 'মাহমুদুল হাসান',
        batch: 'ব্যাচ ২০০১',
        description:
          'আন্তর্জাতিক ফিনটেক প্ল্যাটফর্মের শীর্ষ প্রকৌশলী এবং বিদ্যালয়ের আইসিটি ল্যাব ও শিক্ষার্থীদের কোডিং ক্লাবের নিয়মিত পৃষ্ঠপোষক।',
        image: '/images/teacher_mahmudul_portrait_1795155721712.jpg',
        achievedAt: '2024-02-10',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-star-3',
        title:
          'জাতীয় আন্তঃস্কুল বিতর্ক প্রতিযোগিতায় সেরা বক্তা ও চ্যাম্পিয়ন',
        type: AchievementType.STUDENT_STAR,
        personName: 'নুসরাত জাহান',
        batch: 'ব্যাচ ২০২৩',
        description:
          'জাতীয় টেলিভিশন বিতর্ক প্রতিযোগিতায় ঢাকা বিভাগের চ্যাম্পিয়ন এবং এসএসসিতে গোল্ডেন জিপিএ ৫.০০ প্রাপ্ত কৃতি শিক্ষার্থী।',
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
  }, [achievements, 'bn']);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      <StarsMasonryAlbum
        stars={institutionStars}
      />
    </motion.section>
  );
}
