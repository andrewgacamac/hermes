const HermesProductMonitor = require('./lib/monitoring/product-monitor');
const fs = require('fs');

async function testMonitoringSimple() {
    console.log('🔍 Testing monitoring with simulated data...');
    
    const monitor = new HermesProductMonitor({
        targetProducts: ['Kelly', 'Birkin', 'Bolide'], // Specific bags to monitor
        maxPrice: 20000
    });
    
    try {
        // First, let's manually seed some previous data to test change detection
        const previousProducts = [
            {
                id: 'H075180CK60',
                name: 'Bolide 1923 mini bag',
                price: 7900,
                priceText: 'CA$7,900',
                colors: 'Color: Green',
                availability: 'available',
                link: 'https://www.hermes.com/ca/en/product/bolide-1923-mini-bag-H075180CK60/',
                lastSeen: '2025-07-25T17:00:00.000Z'
            },
            {
                id: 'H082027CK4B',
                name: 'Halzan 25 bag',
                price: 7250,
                priceText: 'CA$7,250',
                colors: 'Color: Beige/Natural',
                availability: 'out of stock', // This will change to available
                link: 'https://www.hermes.com/ca/en/product/halzan-25-bag-H082027CK4B/',
                lastSeen: '2025-07-25T17:00:00.000Z'
            }
        ];
        
        // Save test previous data
        const dataDir = './data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        fs.writeFileSync('./data/previous-products.json', JSON.stringify(previousProducts, null, 2));
        console.log('✅ Seeded previous data for testing');
        
        // Now run monitoring
        console.log('\n🔄 Running monitoring...');
        const result = await monitor.runMonitoring();
        
        console.log('\n📊 Monitoring Results:');
        console.log(`New products: ${result.changes.newProducts.length}`);
        console.log(`Removed products: ${result.changes.removedProducts.length}`);
        console.log(`Price changes: ${result.changes.priceChanges.length}`);
        console.log(`Availability changes: ${result.changes.availabilityChanges.length}`);
        console.log(`SMS alerts sent: ${result.alerts.length}`);
        
        // Show specific changes
        if (result.changes.newProducts.length > 0) {
            console.log('\n🆕 New products:');
            result.changes.newProducts.slice(0, 5).forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} - ${product.priceText}`);
            });
        }
        
        if (result.changes.availabilityChanges.length > 0) {
            console.log('\n📦 Availability changes:');
            result.changes.availabilityChanges.forEach((change, index) => {
                console.log(`${index + 1}. ${change.product.name}: ${change.previousAvailability} → ${change.newAvailability}`);
            });
        }
        
        if (result.alerts.length > 0) {
            console.log('\n📱 SMS Alerts that would be sent:');
            result.alerts.forEach((alert, index) => {
                console.log(`${index + 1}. [${alert.type.toUpperCase()}] ${alert.product.name}`);
                console.log(`    Message: ${alert.message.substring(0, 100)}...`);
            });
        }
        
        // Check if our test products are in the current results
        console.log('\n🎯 Target products found in current scrape:');
        const currentProducts = JSON.parse(fs.readFileSync('./data/previous-products.json', 'utf8'));
        const targetProducts = currentProducts.filter(p => 
            ['Kelly', 'Birkin', 'Bolide', 'Halzan'].some(target => 
                p.name.toLowerCase().includes(target.toLowerCase())
            )
        );
        
        targetProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.priceText} - ${product.availability}`);
        });
        
    } catch (error) {
        console.error('❌ Monitoring test failed:', error.message);
        console.error(error.stack);
    }
}

testMonitoringSimple();