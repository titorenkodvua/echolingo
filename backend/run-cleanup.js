const { cleanupStaleMaterials } = require('./services/cleanupService');
const { initializeDatabase } = require('./models');

(async () => {
  try {
    await initializeDatabase();
    await cleanupStaleMaterials();
    process.exit(0);
  } catch (err) {
    console.error('Manual cleanup failed:', err);
    process.exit(1);
  }
})(); 