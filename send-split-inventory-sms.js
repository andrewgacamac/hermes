const SMSService = require('./lib/sms');
const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function sendSplitInventorySMS() {
    console.log('📦 Preparing split Hermès inventory SMS...');
    
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
                   name !== 'bag';
        });
        
        console.log(`🛍️ Found ${bags.length} actual bags`);
        
        // Split into available and unavailable
        const availableBags = bags.filter(bag => bag.availability === 'available');
        const unavailableBags = bags.filter(bag => bag.availability !== 'available');
        
        console.log(`✅ Available: ${availableBags.length} bags`);
        console.log(`❌ Unavailable: ${unavailableBags.length} bags`);
        
        // Create first message - Available bags
        let availableMessage = '✅ HERMÈS BAGS - AVAILABLE:\n\n';
        availableBags.forEach(bag => {
            availableMessage += `${bag.name} - Available\n`;
        });
        availableMessage += `\n📅 ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}`;
        
        // Create second message - Unavailable bags
        let unavailableMessage = '❌ HERMÈS BAGS - NOT AVAILABLE:\n\n';
        unavailableBags.forEach(bag => {
            unavailableMessage += `${bag.name} - No\n`;
        });
        unavailableMessage += `\n📅 ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}`;
        
        console.log('\n📱 SMS 1 - Available bags:');
        console.log(availableMessage);
        console.log(`📏 Length: ${availableMessage.length} characters`);
        
        console.log('\n📱 SMS 2 - Unavailable bags:');
        console.log(unavailableMessage);
        console.log(`📏 Length: ${unavailableMessage.length} characters`);
        
        // Send first SMS - Available bags
        console.log('\n📤 Sending SMS 1 (Available bags)...');
        const result1 = await sms.sendSMS('+14166693997', availableMessage);
        
        if (result1.success) {
            console.log('✅ SMS 1 sent successfully!');
            console.log(`📱 Message SID: ${result1.messageSid}`);
        } else {
            console.log('❌ Failed to send SMS 1:', result1.error);
            return;
        }
        
        // Wait 2 seconds between messages to avoid rate limiting
        console.log('⏳ Waiting 2 seconds before sending second message...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Send second SMS - Unavailable bags
        console.log('📤 Sending SMS 2 (Unavailable bags)...');
        const result2 = await sms.sendSMS('+14166693997', unavailableMessage);
        
        if (result2.success) {
            console.log('✅ SMS 2 sent successfully!');
            console.log(`📱 Message SID: ${result2.messageSid}`);
            console.log('\n🎉 Both SMS messages sent successfully!');
        } else {
            console.log('❌ Failed to send SMS 2:', result2.error);
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

sendSplitInventorySMS();