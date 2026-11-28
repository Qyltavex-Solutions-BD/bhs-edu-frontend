import { useGetInstitutionProfileQuery } from '../api/institution.api';
import type { SchoolProfile } from '@/src/types/entities';

const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  id: '',
  name: '',
  nameEn: '',
  eiin: '',
  establishedYear: 0,
  address: '',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
};

/**
 * Fetch the live institution profile from `/institution/profile` for print headers.
 */
export function useLiveSchoolProfile(): SchoolProfile {
  const { data } = useGetInstitutionProfileQuery();
  return data ?? INITIAL_SCHOOL_PROFILE;
}
