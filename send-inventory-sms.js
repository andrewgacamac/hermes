const SMSService = require('./lib/sms');
const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function sendInventorySMS() {
    console.log('📦 Preparing Hermès inventory SMS...');
    
    try {
        const monitor = new HermesProductMonitor();
        const sms = new SMSService();
        
        // Get current products
        console.log('🔍 Scraping current products...');
        const products = await monitor.scrapeCurrentProducts();
        
        if (products.length === 0) {
            console.log('❌ No products found');
            return;
        }
        
        console.log(`✅ Found ${products.length} products`);
        
        // Filter to only actual bags (exclude straps, pouches, etc.)
        const bags = products.filter(product => {
            const name = product.name.toLowerCase();
            return name.includes('bag') && 
                   !name.includes('strap') && 
                   !name.includes('pouch') &&
                   name !== 'bag'; // Exclude if just "bag"
        });
        
        console.log(`🛍️ Found ${bags.length} actual bags`);
        
        // Format message: "Bag Name - Available/No"
        let message = '🛍️ HERMÈS BAGS:\n\n';
        
        bags.forEach(bag => {
            const availability = bag.availability === 'available' ? 'Available' : 'No';
            message += `${bag.name} - ${availability}\n`;
        });
        
        // Add timestamp
        message += `\n📅 ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}`;
        
        console.log('\n📱 SMS Content:');
        console.log(message);
        console.log(`\n📏 Message length: ${message.length} characters`);
        
        // Check if message is too long for SMS (160 chars for single SMS, 1600 for concatenated)
        if (message.length > 1600) {
            console.log('⚠️  Message too long, truncating...');
            const truncated = message.substring(0, 1550) + '...\n(List truncated)';
            message = truncated;
        }
        
        // Send SMS
        console.log('📤 Sending SMS...');
        const result = await sms.sendSMS('+14166693997', message);
        
        if (result.success) {
            console.log('✅ SMS sent successfully!');
            console.log(`📱 Message SID: ${result.messageSid}`);
            console.log(`📊 Status: ${result.status}`);
        } else {
            console.log('❌ Failed to send SMS:', result.error);
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

sendInventorySMS();