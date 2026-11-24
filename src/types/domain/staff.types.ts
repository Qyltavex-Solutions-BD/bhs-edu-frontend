import {
  DepartmentStatus,
  StaffStatus,
  StaffType,
  EmploymentType,
  Gender,
  Religion,
  BloodGroup,
} from '../enums';

export interface Staff {
  id: string;
  userId?: string | null;
  employeeId?: string | null;
  name: string;
  nameBn?: string;
  photo?: string | null;
  designation: string;
  qualification?: string | null;
  staffType: StaffType;
  departmentId?: string | null;
  staffStructureId?: string | null;
  employmentType: EmploymentType;
  fatherName?: string | null;
  motherName?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  nid?: string | null;
  bloodGroup?: BloodGroup | null;
  religion?: Religion | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  emergencyContact?: string | null;
  phone?: string | null;
  email?: string | null;
  joiningDate?: string | null;
  leavingDate?: string | null;
  displayOrder: number;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder: number;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffStructure {
  id: string;
  designation: string;
  staffType: StaffType;
  totalPositions: number;
  filledPositions: number;
  departmentId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
