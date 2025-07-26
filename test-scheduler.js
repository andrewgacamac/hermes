const MonitorScheduler = require('./lib/scheduler/monitor-scheduler');

async function testScheduler() {
    console.log('🧪 Testing Monitor Scheduler...');
    
    const scheduler = new MonitorScheduler();
    
    try {
        // Show current configuration
        const status = scheduler.getStatus();
        console.log('\n⚙️  Current Configuration:');
        console.log(JSON.stringify(status.config, null, 2));
        
        console.log('\n🔄 Running a test monitoring cycle...');
        const result = await scheduler.testRun();
        
        console.log('\n📊 Test Results:');
        console.log(`Products found: ${result.changes.newProducts.length + result.changes.removedProducts.length + result.changes.priceChanges.length + result.changes.availabilityChanges.length}`);
        console.log(`New products: ${result.changes.newProducts.length}`);
        console.log(`Price changes: ${result.changes.priceChanges.length}`);
        console.log(`Availability changes: ${result.changes.availabilityChanges.length}`);
        console.log(`SMS alerts sent: ${result.alerts.length}`);
        
        if (result.alerts.length > 0) {
            console.log('\n📱 SMS Alerts sent:');
            result.alerts.forEach((alert, index) => {
                console.log(`${index + 1}. [${alert.type.toUpperCase()}] ${alert.product.name}`);
            });
        }
        
        console.log('\n📈 Scheduler Stats:');
        const finalStatus = scheduler.getStatus();
        console.log(JSON.stringify(finalStatus.stats, null, 2));
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testScheduler();