import { db, clone, uid, nowIso, addAudit } from '../state';
import { RelationshipType, StudentStatus } from '@/src/types/enums';
import type {
  Parent,
  ParentStudent,
} from '@/src/types/entities';
import type { MockHandlerResult } from './types';
import { studentError, parentProfileError, linkGuardian } from './helpers';

export function handleParentsMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
    if (endpoint === '/parents' && method === 'POST') {
      const p = body as Partial<Parent>;
      const name = p.name?.trim() ?? '';
      const phone = p.phone?.trim() ?? '';
      if (!name || !phone) return studentError(400, 'ইংরেজি নাম ও মোবাইল আবশ্যক। / English name and phone are required.');
      const profileError = parentProfileError({ phone, nid: p.nid, email: p.email });
      if (profileError) return studentError(409, profileError);
      const parent = {
        id: uid('par'),
        name,
        nameBn: p.nameBn?.trim() || null,
        phone,
        email: p.email?.trim() || null,
        nid: p.nid?.trim() || null,
        occupation: p.occupation?.trim() || null,
        monthlyIncome: p.monthlyIncome != null && p.monthlyIncome !== ('' as unknown) ? Number(p.monthlyIncome) : null,
        address: p.address?.trim() || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (parent.monthlyIncome != null && Number.isNaN(parent.monthlyIncome)) {
        return studentError(400, 'মাসিক আয় সংখ্যা হতে হবে। / Monthly income must be a number.');
      }
      db.parents.unshift(parent);
      addAudit('PARENT_CREATE', 'Parents', `Added guardian ${parent.name} (${parent.phone}).`);
      return { data: clone(parent) };
    }

    if (endpoint === '/parents/update' && method === 'POST') {
      const p = body as Partial<Parent> & { id: string };
      const parent = db.parents.find((item) => item.id === p.id);
      if (!parent) return studentError(404, 'অভিভাবক পাওয়া যায়নি। / Guardian was not found.');
      const name = (p.name ?? parent.name).trim();
      const phone = (p.phone ?? parent.phone).trim();
      if (!name || !phone) return studentError(400, 'ইংরেজি নাম ও মোবাইল আবশ্যক। / English name and phone are required.');
      const profileError = parentProfileError({ phone, nid: p.nid, email: p.email, ignoreId: parent.id });
      if (profileError) return studentError(409, profileError);
      const income = p.monthlyIncome == null || p.monthlyIncome === ('' as unknown as number) ? null : Number(p.monthlyIncome);
      if (income != null && Number.isNaN(income)) return studentError(400, 'মাসিক আয় সংখ্যা হতে হবে। / Monthly income must be a number.');
      parent.name = name;
      parent.nameBn = p.nameBn?.trim() || null;
      parent.phone = phone;
      parent.email = p.email?.trim() || null;
      parent.nid = p.nid?.trim() || null;
      parent.occupation = p.occupation?.trim() || null;
      parent.monthlyIncome = income;
      parent.address = p.address?.trim() || null;
      parent.updatedAt = nowIso();
      addAudit('PARENT_UPDATE', 'Parents', `Updated guardian ${parent.name}.`);
      return { data: clone(parent) };
    }

    if (endpoint === '/parents/remove' && method === 'POST') {
      const { id } = body as { id: string };
      const parent = db.parents.find((item) => item.id === id);
      if (!parent) return studentError(404, 'অভিভাবক পাওয়া যায়নি। / Guardian was not found.');
      if (db.parentStudents.some((link) => link.parentId === id)) {
        return studentError(409, 'সন্তান যুক্ত থাকা অবস্থায় প্রোফাইল মুছা যায় না। আগে সংযোগ সরান। / Unlink every student before deleting this profile.');
      }
      db.parents = db.parents.filter((item) => item.id !== id);
      addAudit('PARENT_REMOVE', 'Parents', `Removed guardian ${parent.name}.`);
      return { data: { id } };
    }

    if (endpoint === '/parents/link' && method === 'POST') {
      const p = body as {
        parentId: string;
        studentId: string;
        relationship: RelationshipType;
        isPrimary?: boolean;
        isEmergencyContact?: boolean;
        isSmsReceiver?: boolean;
      };
      const parent = db.parents.find((item) => item.id === p.parentId);
      const student = db.students.find((item) => item.id === p.studentId);
      if (!parent || !student) return studentError(404, 'অভিভাবক বা শিক্ষার্থী পাওয়া যায়নি। / Guardian or student was not found.');
      if (!p.relationship) return studentError(400, 'সম্পর্ক আবশ্যক। / Relationship is required.');
      if (db.parentStudents.some((link) => link.parentId === p.parentId && link.studentId === p.studentId)) {
        return studentError(409, 'এই অভিভাবক ইতিমধ্যে এই শিক্ষার্থীর সঙ্গে যুক্ত। / This guardian is already linked to this student.');
      }
      const siblings = db.parentStudents.filter((link) => link.studentId === p.studentId);
      const first = siblings.length === 0;
      const isPrimary = first || Boolean(p.isPrimary);
      const isSmsReceiver = first || Boolean(p.isSmsReceiver);
      const isEmergencyContact = first || Boolean(p.isEmergencyContact);
      if (isPrimary) siblings.forEach((link) => (link.isPrimary = false));
      const link = {
        id: uid('ps'),
        parentId: p.parentId,
        studentId: p.studentId,
        relationship: p.relationship,
        isPrimary,
        isEmergencyContact,
        isSmsReceiver,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.parentStudents.unshift(link);
      addAudit('PARENT_LINK', 'Parents', `Linked ${parent.name} to ${student.studentId} as ${p.relationship}.`);
      return { data: clone(link) };
    }

    if (endpoint === '/parents/link/update' && method === 'POST') {
      const p = body as Partial<ParentStudent> & { id: string };
      const link = db.parentStudents.find((item) => item.id === p.id);
      if (!link) return studentError(404, 'সংযোগ পাওয়া যায়নি। / Link was not found.');
      const others = db.parentStudents.filter((item) => item.studentId === link.studentId && item.id !== link.id);
      const nextPrimary = p.isPrimary ?? link.isPrimary;
      const nextSms = p.isSmsReceiver ?? link.isSmsReceiver;
      const nextEmergency = p.isEmergencyContact ?? link.isEmergencyContact;
      if (!nextPrimary && !others.some((item) => item.isPrimary)) {
        return studentError(400, 'আগে অন্য একজনকে প্রাথমিক অভিভাবক করুন। / Make another guardian primary first.');
      }
      if (!nextSms && !others.some((item) => item.isSmsReceiver)) {
        return studentError(400, 'অন্তত একজনকে SMS প্রাপক রাখতে হবে। / At least one guardian must receive SMS.');
      }
      if (!nextEmergency && !others.some((item) => item.isEmergencyContact)) {
        return studentError(400, 'অন্তত একজন জরুরি যোগাযোগ থাকতে হবে। / At least one emergency contact is required.');
      }
      if (nextPrimary) others.forEach((item) => (item.isPrimary = false));
      if (p.relationship) link.relationship = p.relationship;
      link.isPrimary = nextPrimary;
      link.isSmsReceiver = nextSms;
      link.isEmergencyContact = nextEmergency;
      link.updatedAt = nowIso();
      addAudit('PARENT_LINK_UPDATE', 'Parents', `Updated guardian link ${link.id}.`);
      return { data: clone(link) };
    }

    if (endpoint === '/parents/unlink' && method === 'POST') {
      const { id } = body as { id: string };
      const link = db.parentStudents.find((item) => item.id === id);
      if (!link) return studentError(404, 'সংযোগ পাওয়া যায়নি। / Link was not found.');
      const student = db.students.find((item) => item.id === link.studentId);
      const others = db.parentStudents.filter((item) => item.studentId === link.studentId && item.id !== link.id);
      if (student?.status === StudentStatus.ACTIVE && others.length === 0) {
        return studentError(409, 'সক্রিয় শিক্ষার্থীর শেষ অভিভাবক সরানো যায় না। / An active student must keep one guardian.');
      }
      if (link.isPrimary && !others.some((item) => item.isPrimary) && others.length) {
        return studentError(400, 'আগে অন্য একজনকে প্রাথমিক অভিভাবক করুন। / Make another guardian primary first.');
      }
      if (link.isSmsReceiver && !others.some((item) => item.isSmsReceiver) && others.length) {
        return studentError(400, 'আগে অন্য একজনকে SMS প্রাপক করুন। / Choose another SMS receiver first.');
      }
      db.parentStudents = db.parentStudents.filter((item) => item.id !== id);
      addAudit('PARENT_UNLINK', 'Parents', `Unlinked guardian ${link.parentId} from ${link.studentId}.`);
      return { data: { id } };
    }

    // 14. Issue Transfer Certificate

  return null;
}
