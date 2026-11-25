import { db, clone, uid, nowIso, addAudit } from '../state';
import { studentError } from './helpers';
import type { MockHandlerResult } from './types';

export function handleContentMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
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
