const MonitorScheduler = require('./lib/scheduler/monitor-scheduler');

async function startHermesMonitoring() {
    console.log('🏃‍♂️ Starting Hermès Product Monitor...');
    console.log('📱 SMS alerts will be sent to:', process.env.TEST_RECIPIENT_NUMBER);
    
    const scheduler = new MonitorScheduler();
    
    // Show current configuration
    const status = scheduler.getStatus();
    console.log('\n⚙️  Configuration:');
    console.log(`  📊 Monitoring enabled: ${status.config.monitoring.enabled}`);
    console.log(`  ⏰ Check interval: ${status.config.monitoring.intervalMinutes} minutes`);
    console.log(`  🎯 Target products: ${status.config.filters.targetProducts.join(', ') || 'All products'}`);
    console.log(`  💰 Price range: CA$${status.config.filters.priceRange.min.toLocaleString()} - CA$${status.config.filters.priceRange.max.toLocaleString()}`);
    console.log(`  📱 SMS alerts: ${status.config.notifications.smsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down monitor...');
        scheduler.stop();
        console.log('👋 Monitor stopped. Goodbye!');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n\n🛑 Received termination signal...');
        scheduler.stop();
        process.exit(0);
    });
    
    // Start the scheduler
    const started = scheduler.start();
    
    if (started) {
        console.log('\n✅ Monitoring started successfully!');
        console.log('📈 Monitor will check for new Hermès products and send SMS alerts when changes are detected');
        console.log('🔄 First check will run in 5 seconds...');
        console.log('⏹️  Press Ctrl+C to stop monitoring');
        
        // Show status updates every 10 minutes
        setInterval(() => {
            const currentStatus = scheduler.getStatus();
            console.log(`\n📊 Status Update - Runs: ${currentStatus.stats.runsCompleted}, Products: ${currentStatus.stats.totalProductsFound}, Alerts: ${currentStatus.stats.totalAlertsSet}, Errors: ${currentStatus.stats.errors}`);
        }, 10 * 60 * 1000); // Every 10 minutes
        
    } else {
        console.log('❌ Failed to start monitoring');
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    startHermesMonitoring().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { startHermesMonitoring };