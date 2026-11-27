'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { ContactInformation } from '@/src/types/entities';
import { SchoolCampusMap } from '@/src/components/shared/SchoolCampusMap';
import { Button } from '@/src/components/ui/primitives';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeContactMapSectionProps {
  schoolName: string;
  contactInfo: ContactInformation;
}

export function HomeContactMapSection({
  schoolName,
  contactInfo,
}: HomeContactMapSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      <div className="bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left 5 Columns — Campus Office & Visitor Guidance */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                {'ক্যাম্পাস পরিদর্শন ও অফিস সহায়তা'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                {'যোগাযোগ ও বিদ্যালয় অবস্থান'}
              </h2>
              <p className="text-base text-muted-foreground mt-1.5 leading-relaxed">
                {'ভর্তি, পরীক্ষার ফলাফল, সনদপত্র বা যেকোনো একাডেমিক প্রয়োজনে অফিস চলাকালীন সময়ে সরাসরি বিদ্যালয় অফিসে যোগাযোগ করুন।'}
              </p>
            </div>

            <dl className="space-y-3 pt-1 text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-foreground">
                    {'অফিস সময়'}
                  </dt>
                  <dd className="text-muted-foreground mt-0.5">
                    {'রবিবার – বৃহস্পতিবার, সকাল ১০:০০ – বিকাল ৪:০০ (শুক্র ও শনিবার ছুটি)'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-foreground">
                    {'বিদ্যালয়ের ঠিকানা'}
                  </dt>
                  <dd className="text-muted-foreground mt-0.5 leading-relaxed">
                    {contactInfo.address}
                  </dd>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary tabular-nums transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{contactInfo.phone}</span>
                  </a>
                )}
                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{contactInfo.email}</span>
                  </a>
                )}
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border">
            <Link href="/contact">
              <Button variant="primary">
                <span>{'যোগাযোগ ও বার্তা পাঠান'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline">{'সাধারণ জিজ্ঞাসা (FAQ)'}</Button>
            </Link>
          </div>
        </div>

        {/* Right 7 Columns — Interactive Google Maps */}
        <div className="lg:col-span-7 min-h-[320px] sm:min-h-[360px] border-t lg:border-t-0 lg:border-l border-border">
          <SchoolCampusMap
            schoolName={schoolName}
            address={contactInfo.address}
            phone={contactInfo.phone}
            fallbackMapUrl={contactInfo.mapUrl}
            heightClassName="h-[320px] sm:h-[360px] lg:h-full lg:min-h-[380px]"
            className="rounded-none border-0"
          />
        </div>
      </div>
    </motion.section>
  );
}
