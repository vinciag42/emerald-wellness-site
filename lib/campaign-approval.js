'use strict';
const ALLOWED = new Set(['drafting','internal_review','ceo_review','approved','rejected','scheduled','sent','cancelled']);
function assertSchedulingAllowed(record, confirmation = process.env.KLAVIYO_ALLOW_SCHEDULING) {
  if (!record || !ALLOWED.has(record.approval_status)) throw new Error('Invalid campaign approval record');
  if (record.approval_status !== 'approved') throw new Error('CEO approval is required before scheduling');
  if (String(confirmation) !== 'true') throw new Error('KLAVIYO_ALLOW_SCHEDULING must be explicitly true');
  if (String(process.env.KLAVIYO_DRY_RUN ?? 'true') !== 'false') throw new Error('Dry-run must be explicitly disabled');
  return true;
}
module.exports={ALLOWED,assertSchedulingAllowed};
