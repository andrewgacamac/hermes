const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function checkAvailabilityLogic() {
    console.log('🔍 Checking availability detection logic...');
    
    try {
        const monitor = new HermesProductMonitor();
        
        // Get current products
        console.log('Scraping products...');
        const products = await monitor.scrapeCurrentProducts();
        
        // Filter to only bags
        const bags = products.filter(product => {
            const name = product.name.toLowerCase();
            return name.includes('bag') && 
                   !name.includes('strap') && 
                   !name.includes('pouch') &&
                   name !== 'bag';
        });
        
        console.log(`\nFound ${bags.length} bags total`);
        
        // Group by availability
        const available = bags.filter(b => b.availability === 'available');
        const notAvailable = bags.filter(b => b.availability !== 'available');
        
        console.log(`\n✅ Marked as AVAILABLE (${available.length}):`);
        available.forEach((bag, i) => {
            console.log(`${i + 1}. ${bag.name}`);
        });
        
        console.log(`\n❌ Marked as NOT AVAILABLE (${notAvailable.length}):`);
        notAvailable.forEach((bag, i) => {
            console.log(`${i + 1}. ${bag.name} (status: ${bag.availability})`);
        });
        
        // Let's also check what the raw HTML looks like for a few products
        console.log('\n📊 Availability status distribution:');
        const statusCounts = {};
        bags.forEach(bag => {
            statusCounts[bag.availability] = (statusCounts[bag.availability] || 0) + 1;
        });
        console.log(statusCounts);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAvailabilityLogic();