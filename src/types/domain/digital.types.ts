import { ResourceType } from '../enums';

export interface DigitalClassroom {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalResource {
  id: string;
  academicYearId?: string | null;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  subjectId?: string | null;
  classId?: string | null;
  url: string;
  thumbnail?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
