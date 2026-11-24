import { db, clone, uid, nowIso, addAudit } from '../state';
import { studentError } from './helpers';
import { NoticeStatus } from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';
import type { MockHandlerResult } from './types';

export function handleContentMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {

    if (endpoint === '/notices' && method === 'POST') {
      const payload = body as Partial<Notice>;
      const notice: Notice = {
        id: uid('not'),
        memoNo:
          payload.memoNo?.trim() ||
          `ভউবি/নোটিশ/২০২৬/${String(db.notices.length + 85).padStart(3, '0')}`,
        title: payload.title ?? 'নতুন বিজ্ঞপ্তি',
        description: payload.description ?? '',
        attachment: payload.attachment ?? null,
        attachmentType: payload.attachmentType ?? (payload.attachment ? 'PDF' : 'OFFICIAL_PAD'),
        attachmentUrl: payload.attachmentUrl ?? null,
        attachmentSize: payload.attachmentSize ?? null,
        publishedAt: payload.status === NoticeStatus.PUBLISHED ? nowIso() : null,
        status: payload.status ?? NoticeStatus.DRAFT,
        createdBy: payload.createdBy ?? 'user-admin',
        isUrgent: payload.isUrgent ?? false,
        audience: payload.audience ?? 'ALL',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.notices.unshift(notice);
      addAudit('NOTICE_CREATE', 'Notices', `Created notice: ${notice.title}`);
      return { data: clone(notice) };
    }

    // 13. Register Student + Enrollment + Parent (Unified Admission Engine)
    if (endpoint === '/notifications/read' && method === 'POST') {
      const { id } = (body as { id?: string }) ?? {};
      if (id) {
        const n = db.notifications.find((x) => x.id === id);
        if (n) n.isRead = true;
      } else {
        db.notifications.forEach((x) => (x.isRead = true));
      }
      return { data: { ok: true } };
    }

    // 19. Toggle Role Permission in Permission Matrix
    if (endpoint === '/roles/permission-toggle' && method === 'POST') {
      const { roleId, permissionId } = body as { roleId: string; permissionId: string };
      const existingIdx = db.rolePermissions.findIndex(
        (rp) => rp.roleId === roleId && rp.permissionId === permissionId
      );
      if (existingIdx >= 0) {
        db.rolePermissions.splice(existingIdx, 1);
      } else {
        db.rolePermissions.push({ id: uid('rp'), roleId, permissionId });
      }
      addAudit('PERMISSION_TOGGLE', 'Users', `Updated permission assignment for role ${roleId}.`);
      return { data: { ok: true } };
    }

    // 20. Promote Students Wizard

  return null;
}
