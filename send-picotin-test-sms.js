const SMSService = require('./lib/sms');

async function sendPicotinTestSMS() {
    const sms = new SMSService();
    
    // Create a realistic Picotin found message
    const message = "🎯 PICOTIN FOUND! Picotin Lock 22 bag - CA$7,850 - Color: Black - AVAILABLE. Link: https://www.hermes.com/ca/en/product/picotin-lock-22-bag-H055289CK89/";
    
    console.log('📱 Sending Picotin test SMS...');
    console.log(`📝 Message: "${message}"`);
    console.log(`📞 To: ${process.env.TEST_RECIPIENT_NUMBER}`);
    
    try {
        const result = await sms.sendSMS(process.env.TEST_RECIPIENT_NUMBER, message);
        
        if (result.success) {
            console.log('✅ Test SMS sent successfully!');
            console.log(`📱 Message SID: ${result.messageSid}`);
            console.log(`📊 Status: ${result.status}`);
            console.log('\n🎯 This is what you\'ll receive when a real Picotin is found!');
        } else {
            console.log('❌ Failed to send SMS');
            console.log(`Error: ${result.error}`);
            console.log(`Code: ${result.code}`);
        }
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

sendPicotinTestSMS();