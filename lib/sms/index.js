require('dotenv').config();
const twilio = require('twilio');

class SMSService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        
        if (!this.accountSid || !this.authToken) {
            throw new Error('Twilio credentials missing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.');
        }
        
        this.client = twilio(this.accountSid, this.authToken);
    }

    async sendSMS(to, message, from = null) {
        try {
            this.validatePhoneNumber(to);
            
            const messageOptions = {
                body: message,
                to: to,
                from: from || this.twilioPhone
            };

            if (!messageOptions.from) {
                throw new Error('No Twilio phone number configured. Please set TWILIO_PHONE_NUMBER in your .env file or provide a from parameter.');
            }

            const result = await this.client.messages.create(messageOptions);
            
            return {
                success: true,
                messageSid: result.sid,
                status: result.status,
                to: result.to,
                from: result.from
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    async sendBulkSMS(recipients, message, from = null) {
        const results = [];
        
        for (const recipient of recipients) {
            const result = await this.sendSMS(recipient, message, from);
            results.push({
                recipient,
                ...result
            });
        }
        
        return results;
    }

    async getMessageStatus(messageSid) {
        try {
            const message = await this.client.messages(messageSid).fetch();
            
            return {
                success: true,
                messageSid: message.sid,
                status: message.status,
                to: message.to,
                from: message.from,
                dateCreated: message.dateCreated,
                dateUpdated: message.dateUpdated,
                price: message.price,
                priceUnit: message.priceUnit
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    validatePhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new Error('Invalid phone number format. Please use E.164 format (e.g., +1234567890)');
        }
    }

    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            cleaned = '1' + cleaned;
        }
        
        return '+' + cleaned;
    }
}

module.exports = SMSService;