import {
  LeadershipType,
  MediaType,
  PublicationType,
  AchievementType,
} from '../enums';

export interface WebsiteBanner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadershipMessage {
  id: string;
  personName: string;
  designation: string;
  photo?: string | null;
  message: string;
  type: LeadershipType;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Gallery {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryMedia {
  id: string;
  galleryId: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string | null;
  sortOrder: number;
  createdAt: string;
}

export type AdmissionCycleStatus = 'OPEN' | 'UPCOMING' | 'CLOSED';

export interface AdmissionContent {
  id: string;
  title: string;
  academicSession?: string | null;
  admissionStatus?: AdmissionCycleStatus;
  showOnHomepage?: boolean;
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
  eligibleClasses?: string | null;
  schoolNameBn?: string | null;
  schoolNameEn?: string | null;
  schoolCode?: string | null;
  districtCode?: string | null;
  thanaCode?: string | null;
  eiin?: string | null;
  schoolAddress?: string | null;
  studentNameNotice?: string | null;
  fatherInfoNotice?: string | null;
  motherInfoNotice?: string | null;
  addressInfoNotice?: string | null;
  dobNotice?: string | null;
  birthCertificateNotice?: string | null;
  religionNotice?: string | null;
  prevExamNotice?: string | null;
  prevSchoolNotice?: string | null;
  admissionTypeNotice?: string | null;
  classesAndSections?: string | null;
  availableGroups?: string | null;
  optionalSubjects?: string | null;
  declarationText?: string | null;
  admitCardNotice?: string | null;
  admissionTestDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicationFee?: number | null;
  helplinePhone?: string | null;
  formPdfUrl?: string | null;
  requiredDocuments?: string[] | null;
  publicOpenClassIds?: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInformation {
  id: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  mapUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendancePublicSummary {
  id: string;
  summaryDate: string;
  title: string;
  description?: string | null;
  presentCount?: number | null;
  absentCount?: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  title: string;
  type: PublicationType;
  description?: string | null;
  coverImage?: string | null;
  fileUrl?: string | null;
  publishYear?: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  type: AchievementType;
  personName?: string | null;
  batch?: string | null;
  description?: string | null;
  image?: string | null;
  achievedAt?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
