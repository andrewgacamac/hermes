# Hermez SMS Module

A Node.js SMS service module built with Twilio for sending text messages.

## Features

- Send single SMS messages
- Send bulk SMS to multiple recipients
- Check message delivery status
- Phone number validation and formatting
- Environment-based configuration
- Comprehensive error handling

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Twilio credentials:**
   - Copy `.env.example` to `.env`
   - Get your credentials from [Twilio Console](https://console.twilio.com/)
   - Update `.env` with your actual values:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## Usage

### Basic Usage

```javascript
const SMSService = require('./lib/sms');

const sms = new SMSService();

// Send a single SMS
const result = await sms.sendSMS('+14166693997', 'Hello World!');
console.log(result);
```

### Send Bulk SMS

```javascript
const recipients = ['+14166693997', '+12345678901'];
const results = await sms.sendBulkSMS(recipients, 'Bulk message!');
console.log(results);
```

### Check Message Status

```javascript
const status = await sms.getMessageStatus('SM1234567890abcdef');
console.log(status);
```

### Custom From Number

```javascript
const result = await sms.sendSMS(
    '+14166693997', 
    'Custom sender message',
    '+19876543210'
);
```

## API Reference

### `sendSMS(to, message, from?)`

Sends a single SMS message.

- `to` (string): Recipient phone number in E.164 format
- `message` (string): Message content
- `from` (string, optional): Sender phone number (defaults to TWILIO_PHONE_NUMBER)

Returns:
```javascript
{
    success: true,
    messageSid: "SM1234567890abcdef",
    status: "queued",
    to: "+14166693997",
    from: "+19062928020"
}
```

### `sendBulkSMS(recipients, message, from?)`

Sends SMS to multiple recipients.

- `recipients` (array): Array of phone numbers
- `message` (string): Message content  
- `from` (string, optional): Sender phone number

Returns array of results for each recipient.

### `getMessageStatus(messageSid)`

Retrieves the delivery status of a message.

- `messageSid` (string): The message SID from Twilio

Returns message details including status, pricing, and timestamps.

## Error Handling

All methods return consistent response objects:

```javascript
// Success response
{
    success: true,
    // ... method-specific data
}

// Error response
{
    success: false,
    error: "Error message",
    code: "ERROR_CODE"
}
```

## Phone Number Format

Phone numbers must be in E.164 format: `+1234567890`

The service includes validation and a helper method `formatPhoneNumber()` for US numbers.

## Examples

Run the example file to see all features in action:

```bash
node examples/sms-examples.js
```

## Security

- Never commit your `.env` file to version control
- Use environment variables for all sensitive credentials
- The `.env` file is already added to `.gitignore`

## Deployment

This module is designed to work with DigitalOcean and other cloud providers. Make sure to set environment variables in your production environment.