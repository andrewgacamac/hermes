const SMSService = require('./lib/sms');
const HermesProductMonitor = require('./lib/monitoring/product-monitor');

async function resendIndividualSMSWithAnalysis() {
    console.log('📦 Re-analyzing Hermès inventory and sending individual SMS...');
    
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
        
        // Analyze availability distribution
        const availableCount = bags.filter(b => b.availability === 'available').length;
        const unknownCount = bags.filter(b => b.availability === 'unknown').length;
        const outOfStockCount = bags.filter(b => b.availability === 'out of stock').length;
        
        console.log('\n📊 Availability Analysis:');
        console.log(`✅ Available: ${availableCount} bags`);
        console.log(`❓ Unknown/Not Available: ${unknownCount} bags`);
        console.log(`❌ Out of Stock: ${outOfStockCount} bags`);
        
        // Send each bag as a separate SMS
        console.log('\n📱 Sending individual SMS messages...\n');
        
        for (let i = 0; i < bags.length; i++) {
            const bag = bags[i];
            
            // Determine display status
            let displayStatus;
            if (bag.availability === 'available') {
                displayStatus = 'Available';
            } else if (bag.availability === 'out of stock') {
                displayStatus = 'Out of Stock';
            } else {
                displayStatus = 'Not Available'; // For 'unknown' status
            }
            
            // Clean up bag name (remove duplicates)
            const cleanName = bag.name.replace(/([^a-zA-Z])\1+/g, '$1').replace(/(\b\w+\b)(?:\s+\1)+/g, '$1');
            
            // Create message
            const message = `${cleanName} - ${displayStatus}`;
            
            console.log(`📤 SMS ${i + 1}/${bags.length}: ${message}`);
            console.log(`   Status in data: ${bag.availability}`);
            console.log(`   Price: ${bag.priceText}`);
            
            const result = await sms.sendSMS('+14166693997', message);
            
            if (result.success) {
                console.log(`   ✅ Sent! SID: ${result.messageSid}`);
            } else {
                console.log(`   ❌ Failed: ${result.error}`);
            }
            
            // Wait 1 second between messages
            if (i < bags.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log('');
        }
        
        // Send summary
        console.log('📤 Sending summary message...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const summaryMessage = `📊 HERMÈS SUMMARY: ${bags.length} bags total. Available: ${availableCount}, Not Available: ${unknownCount + outOfStockCount}`;
        
        const summaryResult = await sms.sendSMS('+14166693997', summaryMessage);
        
        if (summaryResult.success) {
            console.log(`✅ Summary sent! SID: ${summaryResult.messageSid}`);
        }
        
        console.log(`\n🎉 Complete! Sent ${bags.length + 1} SMS messages.`);
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

resendIndividualSMSWithAnalysis();