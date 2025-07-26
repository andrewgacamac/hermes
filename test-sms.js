const SMSService = require('./lib/sms');

async function sendTestSMS() {
    try {
        const sms = new SMSService();
        
        console.log('Sending test SMS...');
        const result = await sms.sendSMS('+14166693997', 'I am testing this');
        
        if (result.success) {
            console.log('✅ SMS sent successfully!');
            console.log('Message SID:', result.messageSid);
            console.log('Status:', result.status);
            console.log('To:', result.to);
            console.log('From:', result.from);
        } else {
            console.log('❌ Failed to send SMS');
            console.log('Error:', result.error);
            console.log('Code:', result.code);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

sendTestSMS();