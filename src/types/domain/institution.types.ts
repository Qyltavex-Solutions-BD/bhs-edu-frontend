import { FacilityType, InstitutionContentType } from '../enums';

export interface SchoolProfile {
  id: string;
  name: string;
  nameEn?: string;
  motto?: string;
  eiin?: string | null;
  schoolCode?: string | null;
  logo?: string | null;
  establishedYear?: number | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  mission?: string | null;
  vision?: string | null;
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionContent {
  id: string;
  type: InstitutionContentType;
  title: string;
  description: string;
  image?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolFacility {
  id: string;
  name: string;
  type: FacilityType;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Administrator {
  id: string;
  staffId?: string | null;
  name: string;
  designation: string;
  photo?: string | null;
  message?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagingCommitteeMember {
  id: string;
  name: string;
  designation: string;
  photo?: string | null;
  phone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  isButton: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
