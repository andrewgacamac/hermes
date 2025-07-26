const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function testLoggingOnly() {
    console.log('🧪 Testing logging with searches (SMS disabled)...');
    
    // Create monitor with SMS disabled
    const monitor = new HermesProductMonitor({
        newProducts: true,
        priceChanges: true,
        availabilityChanges: true,
        targetProducts: [],
        maxPrice: 50000
    });
    
    // Disable SMS by overriding the sendAlerts method
    monitor.sendAlerts = async (changes) => {
        console.log('📱 SMS disabled - would have sent alerts for:', changes);
        return []; // Return empty array of alerts
    };
    
    try {
        // First search
        console.log('\n🔍 Performing first search...');
        const result1 = await monitor.runMonitoring();
        console.log(`✅ First search complete - Found ${result1.changes.newProducts.length} new products`);
        
        // Wait 5 minutes
        console.log('\n⏳ Waiting 5 minutes before second search...');
        console.log('   (Refresh your browser to see the first log entry)');
        
        // Show countdown
        for (let i = 300; i > 0; i--) {
            process.stdout.write(`\r   ${Math.floor(i/60)}:${(i%60).toString().padStart(2, '0')} remaining...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Second search
        console.log('\n\n🔍 Performing second search...');
        const result2 = await monitor.runMonitoring();
        console.log(`✅ Second search complete - Found ${result2.changes.newProducts.length} new products`);
        
        console.log('\n✅ Test complete! Check your browser for the log entries.');
        console.log('📁 Logs saved to: public/search-log.json');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLoggingOnly();