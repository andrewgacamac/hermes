const axios = require('axios');
const cheerio = require('cheerio');
const SMSService = require('../sms');
const HtmlLogger = require('../logging/html-logger');

class PicotinMonitor {
    constructor() {
        this.baseUrl = 'https://www.hermes.com/ca/en';
        this.smsService = new SMSService();
        this.htmlLogger = new HtmlLogger();
    }

    async searchForPicotin() {
        try {
            const url = `${this.baseUrl}/category/women/bags-and-small-leather-goods/bags-and-clutches/`;
            const estTime = new Date().toLocaleString('en-US', { 
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            console.log(`🔍 Searching for Picotin bags at ${estTime} EST...`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            const picotinBags = [];
            
            // Search for Picotin bags
            $('.product-grid-list-item').each((index, element) => {
                const $item = $(element);
                const name = $item.find('.product-item-name, .product-title').text().trim();
                
                // Check if product name contains "Picotin" (case insensitive)
                if (name && name.toLowerCase().includes('picotin')) {
                    const price = $item.find('.product-item-price').text().trim();
                    const colors = $item.find('.product-item-colors').text().trim();
                    
                    const linkElement = $item.find('a[href*="/product/"]');
                    let link = linkElement.attr('href');
                    if (link && !link.startsWith('http')) {
                        link = 'https://www.hermes.com' + link;
                    }
                    
                    // Check availability
                    const itemText = $item.text().toLowerCase();
                    let availability = 'available'; // Default to available if found
                    if (itemText.includes('out of stock') || itemText.includes('sold out')) {
                        availability = 'not available';
                    }
                    
                    picotinBags.push({
                        name: name,
                        price: price,
                        colors: colors,
                        link: link,
                        availability: availability
                    });
                }
            });
            
            // Process results
            if (picotinBags.length > 0) {
                console.log(`✅ Found ${picotinBags.length} Picotin bag(s)!`);
                
                // Send SMS alerts for each Picotin found
                for (const bag of picotinBags) {
                    const message = `🎯 PICOTIN FOUND! ${bag.name} - ${bag.price} - ${bag.colors} - ${bag.availability.toUpperCase()}. Link: ${bag.link}`;
                    
                    try {
                        const result = await this.smsService.sendSMS(
                            process.env.TEST_RECIPIENT_NUMBER,
                            message
                        );
                        
                        if (result.success) {
                            console.log(`📱 SMS sent for: ${bag.name}`);
                        } else {
                            console.log(`❌ Failed to send SMS: ${result.error}`);
                        }
                        
                        // Wait between messages
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } catch (error) {
                        console.error(`Error sending SMS: ${error.message}`);
                    }
                }
                
                // Log to HTML
                this.htmlLogger.logSearch(true, `Found ${picotinBags.length} Picotin bag(s)!`, {
                    productsFound: picotinBags.length,
                    products: picotinBags,
                    alertsSent: picotinBags.length
                });
                
                return {
                    success: true,
                    found: true,
                    count: picotinBags.length,
                    bags: picotinBags
                };
                
            } else {
                console.log('❌ No Picotin bags found');
                
                // Log empty search
                this.htmlLogger.logSearch(true, 'No Picotin bags found - empty search', {
                    productsFound: 0,
                    alertsSent: 0
                });
                
                return {
                    success: true,
                    found: false,
                    count: 0,
                    bags: []
                };
            }
            
        } catch (error) {
            console.error('Error searching for Picotin:', error.message);
            
            // Log error
            this.htmlLogger.logError('Failed to search for Picotin bags', error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async sendStartupNotification() {
        const message = "🚀 Hermès Picotin Monitor STARTED - We will be searching for Picotin today every 5 min";
        
        try {
            const result = await this.smsService.sendSMS(
                process.env.TEST_RECIPIENT_NUMBER,
                message
            );
            
            if (result.success) {
                console.log('📱 Startup notification sent');
            } else {
                console.log('❌ Failed to send startup notification:', result.error);
            }
            
            // Log the startup
            this.htmlLogger.logSearch(true, 'Monitor started - Searching for Picotin every 5 min', {
                productsFound: 0,
                alertsSent: 1
            });
            
        } catch (error) {
            console.error('Error sending startup notification:', error.message);
        }
    }
    
    async sendDailyNotification() {
        const message = "☀️ Good morning! We will be searching for Picotin today every 5 min";
        
        try {
            const result = await this.smsService.sendSMS(
                process.env.TEST_RECIPIENT_NUMBER,
                message
            );
            
            if (result.success) {
                console.log('📱 Daily 9 AM notification sent');
            } else {
                console.log('❌ Failed to send daily notification:', result.error);
            }
            
            // Log the daily notification
            this.htmlLogger.logSearch(true, 'Daily 9 AM notification - Searching for Picotin today', {
                productsFound: 0,
                alertsSent: 1
            });
            
        } catch (error) {
            console.error('Error sending daily notification:', error.message);
        }
    }

    async runContinuousSearch(intervalMinutes = 5) {
        console.log(`🚀 Starting Picotin monitoring every ${intervalMinutes} minutes...`);
        console.log(`📱 SMS alerts will be sent to: ${process.env.TEST_RECIPIENT_NUMBER}`);
        console.log('🔍 Searching only for bags with "Picotin" in the name\n');
        
        // Send startup notification
        await this.sendStartupNotification();
        
        // Run first search immediately
        await this.searchForPicotin();
        
        // Track if we've sent the 9 AM notification today
        let lastDailyNotificationDate = null;
        
        // Set up interval
        setInterval(async () => {
            // Check business hours if configured
            if (process.env.MONITOR_BUSINESS_HOURS_ONLY === 'true') {
                // Get current time in EST/EDT
                const nowEST = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
                const now = new Date(nowEST);
                const hour = now.getHours();
                const minute = now.getMinutes();
                const day = now.getDay();
                const today = now.toDateString();
                
                // Send 9 AM notification if it's a weekday and we haven't sent it today
                if (hour === 9 && minute < 5 && day >= 1 && day <= 5 && lastDailyNotificationDate !== today) {
                    await this.sendDailyNotification();
                    lastDailyNotificationDate = today;
                }
                
                const startHour = parseInt(process.env.MONITOR_START_HOUR) || 9;
                const endHour = parseInt(process.env.MONITOR_END_HOUR) || 18;
                const weekdaysOnly = process.env.MONITOR_WEEKDAYS_ONLY === 'true';
                
                if (weekdaysOnly && (day === 0 || day === 6)) {
                    console.log(`⏰ Skipping - weekend (${now.toLocaleString()})`);
                    return;
                }
                
                if (hour < startHour || hour >= endHour) {
                    console.log(`⏰ Skipping - outside business hours (${now.toLocaleString()})`);
                    return;
                }
            }
            
            await this.searchForPicotin();
            
        }, intervalMinutes * 60 * 1000);
    }
}

module.exports = PicotinMonitor;