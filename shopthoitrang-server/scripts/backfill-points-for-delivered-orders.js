/**
 * Backfill: Queue and approve points for delivered orders older than 7 days
 * - Finds orders with status delivered (Đã giao / Hoàn thành)
 * - Skips orders that already have point transactions
 * - Creates pending point transactions (available_at = ngaygiaohang + 7)
 * - Then triggers approval job to release pending points due
 *
 * Run:
 *   node scripts/backfill-points-for-delivered-orders.js
 */

require('dotenv').config();
const supabase = require('../config/db');
const membershipService = require('../src/services/membership.service');
const pointTxRepo = require('../src/repositories/point_transaction.repository');

function normalizeStatus(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase();
}

async function fetchDeliveredOrdersWithoutPoints(cutoffDateIso) {
  // Fetch delivered orders where ngaygiaohang <= cutoff
  const { data: orders, error } = await supabase
    .from('donhang')
    .select('madonhang, makhachhang, thanhtien, trangthaidonhang, ngaygiaohang')
    .lte('ngaygiaohang', cutoffDateIso)
    .order('ngaygiaohang', { ascending: true });
  if (error) throw error;
  if (!orders) return [];

  const delivered = orders.filter((o) => {
    const st = normalizeStatus(o.trangthaidonhang);
    return st.includes('DA GIAO') || st.includes('HOAN THANH');
  });

  const result = [];
  for (const o of delivered) {
    // Check existing transactions for this order
    const txs = await pointTxRepo.findByOrder(o.madonhang);
    const hasEarn = txs.some((t) => t.type === 'EARN');
    if (!hasEarn) result.push(o);
  }
  return result;
}

async function main() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 7);
  console.log('[BackfillPoints] Cutoff <=', cutoff.toISOString());

  const candidates = await fetchDeliveredOrdersWithoutPoints(cutoff.toISOString());
  console.log(`[BackfillPoints] Found ${candidates.length} delivered orders without points`);

  let queued = 0;
  for (const order of candidates) {
    try {
      await membershipService.recordOrderSpending(order);
      queued += 1;
      console.log(`[BackfillPoints] Queued points for order #${order.madonhang} (KH ${order.makhachhang})`);
    } catch (e) {
      console.error(`[BackfillPoints] Failed to queue for order #${order.madonhang}:`, e.message || e);
    }
  }

  console.log(`[BackfillPoints] Queued ${queued} orders. Running approval...`);
  const result = await membershipService.releasePendingPoints(new Date());
  console.log('[BackfillPoints] Approval result:', result);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
