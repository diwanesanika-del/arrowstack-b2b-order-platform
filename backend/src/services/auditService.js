import { query as defaultQuery } from '../config/db.js';

export async function logAudit({
  client,
  userId = null,
  action,
  entityType,
  entityId,
  details = null,
  ipAddress = null
}) {
  const q = client ? client.query.bind(client) : defaultQuery;

  try {
    await q(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6);
      `,
      [
        userId,
        action,
        entityType,
        String(entityId),
        details ? JSON.stringify(details) : null,
        ipAddress
      ]
    );
  } catch (err) {
    // Audit logging should not crash the primary transaction, but log an error to server console
    console.error('Failed to write audit log:', err.message);
  }
}
