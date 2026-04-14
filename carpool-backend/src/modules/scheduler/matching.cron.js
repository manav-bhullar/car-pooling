const cron = require('node-cron');
const { runMatchingCycle } = require('../integrations/matchingIntegration');

let isRunning = false;

function startMatchingScheduler() {
  cron.schedule('*/60 * * * * *', async () => {
    if (isRunning) return;

    try {
      isRunning = true;
      console.log('🚀 Running matching batch...');

      await runMatchingCycle('CRON');

      console.log('✅ Matching batch completed');
    } catch (err) {
      console.error('❌ Matching batch failed:', err);
    } finally {
      isRunning = false;
    }
  });

  console.log(`✅ Matching scheduler started`);
}

module.exports = {
  startMatchingScheduler,
};
