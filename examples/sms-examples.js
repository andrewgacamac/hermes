const SMSService = require('../lib/sms');

async function runExamples() {
    const sms = new SMSService();

    console.log('=== SMS Service Examples ===\n');

    // Example 1: Send a single SMS
    console.log('1. Sending a single SMS...');
    const singleResult = await sms.sendSMS('+14166693997', 'Hello from Hermez SMS service!');
    console.log('Result:', singleResult);
    console.log('');

    // Example 2: Send SMS with custom from number
    console.log('2. Sending SMS with custom from number...');
    const customFromResult = await sms.sendSMS(
        '+14166693997', 
        'This is a test message with custom sender',
        '+19062928020'
    );
    console.log('Result:', customFromResult);
    console.log('');

    // Example 3: Send bulk SMS
    console.log('3. Sending bulk SMS...');
    const recipients = ['+14166693997', '+12345678901', '+19876543210'];
    const bulkResults = await sms.sendBulkSMS(recipients, 'Bulk message from Hermez!');
    console.log('Bulk Results:');
    bulkResults.forEach((result, index) => {
        console.log(`  Recipient ${index + 1}:`, result);
    });
    console.log('');

    // Example 4: Check message status (if we have a successful message)
    if (singleResult.success) {
        console.log('4. Checking message status...');
        const statusResult = await sms.getMessageStatus(singleResult.messageSid);
        console.log('Status Result:', statusResult);
    }

    // Example 5: Error handling - invalid phone number
    console.log('5. Testing error handling with invalid phone number...');
    const errorResult = await sms.sendSMS('invalid-phone', 'This should fail');
    console.log('Error Result:', errorResult);
}

// Only run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}

module.exports = { runExamples };