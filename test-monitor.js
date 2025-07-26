const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function testMonitoring() {
    console.log('🔍 Testing Hermès product monitoring...');
    
    const monitor = new HermesProductMonitor({
        newProducts: true,
        priceChanges: true,
        availabilityChanges: true,
        targetProducts: [], // Monitor all products for now
        maxPrice: 15000, // Alert for products under CA$15,000
        minPrice: 1000   // Alert for products over CA$1,000
    });
    
    try {
        const result = await monitor.runMonitoring();
        
        console.log('\n📊 Monitoring Results:');
        console.log(`New products: ${result.changes.newProducts.length}`);
        console.log(`Removed products: ${result.changes.removedProducts.length}`);
        console.log(`Price changes: ${result.changes.priceChanges.length}`);
        console.log(`Availability changes: ${result.changes.availabilityChanges.length}`);
        console.log(`SMS alerts sent: ${result.alerts.length}`);
        
        if (result.changes.newProducts.length > 0) {
            console.log('\n🆕 New products detected:');
            result.changes.newProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} - ${product.priceText}`);
            });
        }
        
        if (result.changes.priceChanges.length > 0) {
            console.log('\n💰 Price changes detected:');
            result.changes.priceChanges.forEach((change, index) => {
                const direction = change.change > 0 ? '📈' : '📉';
                console.log(`${index + 1}. ${direction} ${change.product.name}: CA$${change.previousPrice?.toLocaleString()} → ${change.product.priceText}`);
            });
        }
        
        if (result.alerts.length > 0) {
            console.log('\n📱 SMS Alerts sent:');
            result.alerts.forEach((alert, index) => {
                console.log(`${index + 1}. [${alert.type.toUpperCase()}] ${alert.message}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Monitoring failed:', error.message);
    }
}

testMonitoring();