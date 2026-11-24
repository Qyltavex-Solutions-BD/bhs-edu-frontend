import { RelationshipType } from '../enums';

export interface Parent {
  id: string;
  userId?: string | null;
  name: string;
  nameBn?: string | null;
  phone: string;
  email?: string | null;
  nid?: string | null;
  occupation?: string | null;
  monthlyIncome?: number | null;
  photo?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentStudent {
  id: string;
  parentId: string;
  studentId: string;
  relationship: RelationshipType;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  isSmsReceiver: boolean;
  createdAt: string;
  updatedAt: string;
}
