/**
 * Standalone Cron Scheduler Runner for DocTruyen.VIP
 * 
 * Usage:
 *   node scripts/cron_scheduler.mjs
 * 
 * Features:
 *   - Runs locally or on a server in the background (or PM2).
 *   - Periodically pings https://www.doctruyen.vip/api/cron/social-backfill and /api/cron/trends.
 *   - Auto-retries with logging.
 */

const BACKFILL_URL = process.env.CRON_BACKFILL_URL || 'https://www.doctruyen.vip/api/cron/social-backfill';
const TRENDS_URL = process.env.CRON_TRENDS_URL || 'https://www.doctruyen.vip/api/cron/trends';
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

async function pingEndpoint(name, url) {
  const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'DocTruyenVip-Scheduler/1.0' },
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    console.log(`[${timeStr}] [${name}] HTTP ${res.status}:`, typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : String(data).slice(0, 200));
  } catch (err) {
    console.error(`[${timeStr}] [${name}] Error:`, err.message);
  }
}

async function runAll() {
  console.log(`\n--- [${new Date().toISOString()}] Running Scheduled Tasks ---`);
  await pingEndpoint('Social Backfill', BACKFILL_URL);
  await pingEndpoint('AI Trends', TRENDS_URL);
}

// Run immediately on start
runAll();

// Then run on interval
setInterval(runAll, CHECK_INTERVAL_MS);
console.log(`DocTruyen.VIP Cron Scheduler started. Checking every ${CHECK_INTERVAL_MS / 60000} minutes.`);
