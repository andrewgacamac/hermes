const PicotinMonitor = require('./lib/monitoring/picotin-monitor');

async function testStartupNotification() {
    console.log('🧪 Testing startup and daily notifications...\n');
    
    const monitor = new PicotinMonitor();
    
    console.log('1️⃣ Testing startup notification:');
    await monitor.sendStartupNotification();
    
    console.log('\n2️⃣ Testing daily 9 AM notification:');
    await monitor.sendDailyNotification();
    
    console.log('\n✅ Notification tests complete!');
}

testStartupNotification();