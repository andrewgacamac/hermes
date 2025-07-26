const PicotinMonitor = require('./lib/monitoring/picotin-monitor');
require('dotenv').config();

async function startPicotinMonitoring() {
    console.log('🛍️ Starting Hermès Picotin Monitor...');
    console.log('='.repeat(50));
    console.log('📋 Configuration:');
    console.log(`   🔍 Target: Picotin bags only`);
    console.log(`   📱 SMS to: ${process.env.TEST_RECIPIENT_NUMBER}`);
    console.log(`   ⏰ Interval: Every ${process.env.MONITOR_INTERVAL_MINUTES || 5} minutes`);
    
    if (process.env.MONITOR_BUSINESS_HOURS_ONLY === 'true') {
        console.log(`   🏢 Business hours: ${process.env.MONITOR_START_HOUR || 9}:00 - ${process.env.MONITOR_END_HOUR || 18}:00`);
        console.log(`   📅 Days: ${process.env.MONITOR_WEEKDAYS_ONLY === 'true' ? 'Monday-Friday only' : 'Every day'}`);
    } else {
        console.log(`   🕐 Schedule: 24/7`);
    }
    
    console.log('='.repeat(50));
    console.log('\n📍 Search criteria:');
    console.log('   - Any bag with "Picotin" in the name (case insensitive)');
    console.log('   - SMS sent immediately when found');
    console.log('   - Empty searches logged but no SMS\n');
    
    const monitor = new PicotinMonitor();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down Picotin monitor...');
        console.log('👋 Goodbye!');
        process.exit(0);
    });
    
    // Start monitoring
    await monitor.runContinuousSearch(parseInt(process.env.MONITOR_INTERVAL_MINUTES) || 5);
    
    // Keep process alive
    console.log('⏹️  Press Ctrl+C to stop monitoring\n');
}

// Run if executed directly
if (require.main === module) {
    startPicotinMonitoring().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { startPicotinMonitoring };