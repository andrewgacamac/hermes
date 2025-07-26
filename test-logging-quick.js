const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function testLoggingQuick() {
    console.log('🧪 Running second search for logging test...');
    
    // Create monitor with SMS disabled
    const monitor = new HermesProductMonitor({
        newProducts: true,
        priceChanges: true,
        availabilityChanges: true,
        targetProducts: [],
        maxPrice: 50000
    });
    
    // Disable SMS
    monitor.sendAlerts = async (changes) => {
        console.log('📱 SMS disabled');
        return [];
    };
    
    try {
        console.log('\n🔍 Performing second search...');
        const result = await monitor.runMonitoring();
        
        console.log(`✅ Search complete!`);
        console.log(`   Products found: ${result.changes.newProducts.length + result.changes.removedProducts.length + result.changes.priceChanges.length + result.changes.availabilityChanges.length} changes`);
        console.log('\n📊 Refresh your browser to see the updated logs!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLoggingQuick();