const cron = require('node-cron');
const { cleanupStaleMaterials } = require('../services/cleanupService');

// Запускать каждый день в 3:00 ночи
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Starting cleanup of stale materials...');
  try {
    await cleanupStaleMaterials();
  } catch (err) {
    console.error('[CRON] Cleanup failed:', err);
  }
}); 