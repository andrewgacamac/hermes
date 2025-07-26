const PicotinMonitor = require('./lib/monitoring/picotin-monitor');

async function testPicotinSearch() {
    console.log('🧪 Testing Picotin search...\n');
    
    const monitor = new PicotinMonitor();
    
    // Disable SMS for testing (comment this out to enable SMS)
    monitor.smsService.sendSMS = async (to, message) => {
        console.log(`📱 [SMS DISABLED] Would send to ${to}:`);
        console.log(`   "${message}"`);
        return { success: true, messageSid: 'TEST' };
    };
    
    const result = await monitor.searchForPicotin();
    
    console.log('\n📊 Search Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.found) {
        console.log('\n🛍️ Picotin bags found:');
        result.bags.forEach((bag, index) => {
            console.log(`\n${index + 1}. ${bag.name}`);
            console.log(`   💰 Price: ${bag.price}`);
            console.log(`   🎨 Colors: ${bag.colors}`);
            console.log(`   📦 Status: ${bag.availability}`);
            console.log(`   🔗 Link: ${bag.link}`);
        });
    }
}

testPicotinSearch();