import { LibraryDistributionType } from '../enums';

export interface LibraryProfile {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  updatedAt: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  category?: string | null;
  description?: string | null;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryDistributionInfo {
  id: string;
  type: LibraryDistributionType;
  title: string;
  description?: string | null;
  distributionDate?: string | null;
  image?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
