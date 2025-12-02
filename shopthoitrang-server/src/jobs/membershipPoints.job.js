const membershipService = require('../services/membership.service');

/**
 * Simple scheduler that periodically releases pending membership points.
 * Orders earn points immediately into the "pending" bucket when the status
 * becomes "Đã giao". After 7 days (and no return / cancel) we need to move
 * those points into the active balance. Previously this required running the
 * script manually. This job keeps calling membershipService.releasePendingPoints
 * in the background so customers automatically receive points.
 */

const DEFAULT_INTERVAL_MINUTES = 60; // run once per hour by default

function startMembershipPointsJob() {
  const disabled = String(process.env.MEMBERSHIP_POINTS_JOB_DISABLED || '').toLowerCase() === 'true';
  if (disabled) {
    console.log('[MembershipPointsJob] Disabled via env MEMBERSHIP_POINTS_JOB_DISABLED');
    return;
  }

  const intervalMinutes = Number(process.env.MEMBERSHIP_POINTS_JOB_INTERVAL_MINUTES || DEFAULT_INTERVAL_MINUTES);
  const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

  const runJob = async (trigger = 'manual') => {
    const startedAt = new Date();
    console.log(`[MembershipPointsJob] Triggered (${trigger}) at ${startedAt.toISOString()}`);

    try {
      const result = await membershipService.releasePendingPoints(startedAt);
      console.log(
        `[MembershipPointsJob] Completed (${trigger}). Released=${result.released}, cancelled=${result.cancelled}`
      );
    } catch (err) {
      console.error('[MembershipPointsJob] Failed:', err?.message || err);
    }
  };

  // Run immediately on server start to capture due points
  runJob('startup');

  // Schedule subsequent runs
  const timer = setInterval(() => runJob('interval'), intervalMs);
  if (typeof timer.unref === 'function') {
    // Allow Node to exit gracefully if this is the only pending timer
    timer.unref();
  }
}

module.exports = startMembershipPointsJob;
