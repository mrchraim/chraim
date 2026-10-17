// ==========================================================================
// سجل التدقيق
// ==========================================================================
import { run } from '../lib/db.mjs';

export function audit(ctx, action, entity, entityId = null, details = '') {
  try {
    run(
      'INSERT INTO audit_logs (admin_id, action, entity, entity_id, details) VALUES (?,?,?,?,?)',
      ctx.session?.adminId ?? null,
      action,
      entity,
      entityId,
      String(details).slice(0, 500),
    );
  } catch {
    // لا نُفشل الطلب بسبب فشل التدقيق.
  }
}
