const SMSService = require('./lib/sms');

async function sendTestMessage() {
    const sms = new SMSService();
    
    const message = "we are testing now";
    
    console.log('📱 Sending test SMS...');
    console.log(`📝 Message: "${message}"`);
    console.log(`📞 To: ${process.env.TEST_RECIPIENT_NUMBER}`);
    console.log(`🔑 Using Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);
    
    try {
        const result = await sms.sendSMS(process.env.TEST_RECIPIENT_NUMBER, message);
        
        if (result.success) {
            console.log('✅ SMS sent successfully!');
            console.log(`📱 Message SID: ${result.messageSid}`);
            console.log(`📊 Status: ${result.status}`);
        } else {
            console.log('❌ Failed to send SMS');
            console.log(`Error: ${result.error}`);
            console.log(`Code: ${result.code}`);
        }
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

sendTestMessage();