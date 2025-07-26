const SMSService = require('./lib/sms');
const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function sendIndividualBagSMS() {
    console.log('📦 Preparing individual Hermès bag SMS messages...');
    
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
        
        // Send each bag as a separate SMS
        for (let i = 0; i < bags.length; i++) {
            const bag = bags[i];
            const availability = bag.availability === 'available' ? 'Available' : 'No';
            
            // Create simple message: "Bag Name - Available/No"
            const message = `${bag.name} - ${availability}`;
            
            console.log(`\n📤 Sending SMS ${i + 1}/${bags.length}: ${message}`);
            console.log(`📏 Length: ${message.length} characters`);
            
            const result = await sms.sendSMS('+14166693997', message);
            
            if (result.success) {
                console.log(`✅ SMS ${i + 1} sent successfully! SID: ${result.messageSid}`);
            } else {
                console.log(`❌ Failed to send SMS ${i + 1}: ${result.error}`);
            }
            
            // Wait 1 second between messages to avoid rate limiting
            if (i < bags.length - 1) {
                console.log('⏳ Waiting 1 second...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`\n🎉 Completed! Sent ${bags.length} individual SMS messages.`);
        
        // Send summary message
        console.log('\n📤 Sending summary message...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const summaryMessage = `📊 HERMÈS INVENTORY COMPLETE: ${bags.length} bags total. Available: ${bags.filter(b => b.availability === 'available').length}, Not available: ${bags.filter(b => b.availability !== 'available').length}`;
        
        const summaryResult = await sms.sendSMS('+14166693997', summaryMessage);
        
        if (summaryResult.success) {
            console.log(`✅ Summary SMS sent! SID: ${summaryResult.messageSid}`);
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

sendIndividualBagSMS();