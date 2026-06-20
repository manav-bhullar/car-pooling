const cron = require('node-cron');
const { runMatchingCycle } = require('../integrations/matchingIntegration');

let isRunning = false;
let schedulerStarted = false;

function startMatchingScheduler() {
  if (schedulerStarted) {
    console.warn('⚠️ Scheduler already started. Ignoring duplicate start.');
    return;
  }
  schedulerStarted = true;
  cron.schedule('*/45 * * * * *', async () => {
    if (isRunning) {
      console.log('⏭️ Skipping overlapping batch');
      return;
    }
    try {
      isRunning = true;
      console.log('🚀 Running matching batch...');
      const metrics = await runMatchingCycle('CRON');
      // Log batch metrics
      console.log(`✅ Matching batch completed | tripsCreated=${metrics.tripsCreated} usersMatched=${metrics.usersMatched} pendingRemaining=${metrics.usersStillPending} autoCancelled=${metrics.autoCancelledCount} durationMs=${metrics.durationMs}`);
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
