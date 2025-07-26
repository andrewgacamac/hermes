const cron = require('node-cron');
const HermesProductMonitor = require('../monitoring/product-monitor');
const fs = require('fs');
const path = require('path');

class MonitorScheduler {
    constructor(configPath = null) {
        this.configPath = configPath || path.join(__dirname, '../../config/monitor-config.json');
        this.config = this.loadConfig();
        this.monitor = new HermesProductMonitor(this.config.filters);
        this.isRunning = false;
        this.task = null;
        this.stats = {
            runsCompleted: 0,
            totalProductsFound: 0,
            totalAlertsSet: 0,
            lastRun: null,
            errors: 0
        };
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                const config = JSON.parse(configData);
                
                // Override with environment variables if set
                if (process.env.MONITOR_INTERVAL_MINUTES) {
                    config.monitoring.intervalMinutes = parseInt(process.env.MONITOR_INTERVAL_MINUTES);
                }
                if (process.env.ALERT_ENABLED === 'false') {
                    config.alerts.newProducts = false;
                    config.alerts.priceChanges = false;
                    config.alerts.availabilityChanges = false;
                }
                if (process.env.TEST_RECIPIENT_NUMBER) {
                    config.notifications.recipientNumber = process.env.TEST_RECIPIENT_NUMBER;
                }
                
                return config;
            }
        } catch (error) {
            console.error('Error loading config:', error.message);
        }
        
        // Default config if file doesn't exist or has errors
        return {
            monitoring: { enabled: true, intervalMinutes: 30, maxRetries: 3 },
            alerts: { newProducts: true, priceChanges: true, availabilityChanges: true },
            filters: { targetProducts: [], priceRange: { min: 0, max: 100000 } },
            notifications: { smsEnabled: true, recipientNumber: process.env.TEST_RECIPIENT_NUMBER || '' }
        };
    }

    getCronExpression() {
        const minutes = this.config.monitoring.intervalMinutes;
        
        if (minutes < 60) {
            // Every X minutes
            return `*/${minutes} * * * *`;
        } else {
            // Every X hours
            const hours = Math.floor(minutes / 60);
            return `0 */${hours} * * *`;
        }
    }

    isBusinessHours() {
        // Get current time in EST/EDT
        const nowEST = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        const now = new Date(nowEST);
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Check if business hours monitoring is enabled
        if (process.env.MONITOR_BUSINESS_HOURS_ONLY !== 'true') {
            return true; // Run 24/7 if not restricted
        }
        
        // Check weekday restriction
        if (process.env.MONITOR_WEEKDAYS_ONLY === 'true' && (day === 0 || day === 6)) {
            return false; // Skip weekends
        }
        
        // Check hour restriction
        const startHour = parseInt(process.env.MONITOR_START_HOUR) || 9;
        const endHour = parseInt(process.env.MONITOR_END_HOUR) || 18;
        
        return hour >= startHour && hour < endHour;
    }

    async runMonitoring() {
        if (this.isRunning) {
            console.log('⏸️  Monitoring already in progress, skipping this run');
            return;
        }

        // Check if we're in business hours
        if (!this.isBusinessHours()) {
            const now = new Date();
            console.log(`⏰ Outside business hours (${now.toLocaleTimeString()}), skipping this run`);
            return;
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            console.log(`🚀 Starting scheduled monitoring at ${startTime.toISOString()}`);
            
            // Update monitor settings from config
            this.monitor.alertSettings = {
                ...this.monitor.alertSettings,
                ...this.config.alerts,
                ...this.config.filters
            };
            
            const result = await this.monitor.runMonitoring();
            
            // Update stats
            this.stats.runsCompleted++;
            this.stats.totalProductsFound += result.changes.newProducts.length;
            this.stats.totalAlertsSet += result.alerts.length;
            this.stats.lastRun = startTime.toISOString();
            
            const duration = new Date() - startTime;
            console.log(`✅ Monitoring completed in ${duration}ms`);
            console.log(`📊 Found: ${result.changes.newProducts.length} new, ${result.changes.priceChanges.length} price changes, ${result.changes.availabilityChanges.length} availability changes`);
            console.log(`📱 Sent ${result.alerts.length} SMS alerts`);
            
            // Log summary to file
            this.logSummary(result, duration);
            
            return result;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Scheduled monitoring failed:', error.message);
            
            // Log error
            this.monitor.log(`Scheduled monitoring failed: ${error.message}`, 'ERROR');
            
            // Send error notification if configured
            if (this.config.notifications.smsEnabled && this.config.notifications.recipientNumber) {
                try {
                    await this.monitor.smsService.sendSMS(
                        this.config.notifications.recipientNumber,
                        `⚠️ Hermès monitor error: ${error.message.substring(0, 100)}`
                    );
                } catch (smsError) {
                    console.error('Failed to send error SMS:', smsError.message);
                }
            }
            
            throw error;
            
        } finally {
            this.isRunning = false;
        }
    }

    start() {
        if (!this.config.monitoring.enabled) {
            console.log('❌ Monitoring is disabled in config');
            return false;
        }

        if (this.task) {
            console.log('⚠️  Scheduler already running');
            return false;
        }

        const cronExpression = this.getCronExpression();
        console.log(`⏰ Starting scheduler with expression: ${cronExpression}`);
        console.log(`📅 Will run every ${this.config.monitoring.intervalMinutes} minutes`);
        
        if (process.env.MONITOR_BUSINESS_HOURS_ONLY === 'true') {
            const startHour = process.env.MONITOR_START_HOUR || 9;
            const endHour = process.env.MONITOR_END_HOUR || 18;
            const weekdaysOnly = process.env.MONITOR_WEEKDAYS_ONLY === 'true';
            console.log(`🏢 Business hours: ${startHour}:00 - ${endHour}:00${weekdaysOnly ? ' (Mon-Fri only)' : ''}`);
        }
        
        this.task = cron.schedule(cronExpression, async () => {
            await this.runMonitoring();
        }, {
            scheduled: false, // Don't start immediately
            timezone: 'America/New_York' // EST/EDT timezone
        });

        this.task.start();
        
        // Run once immediately if configured to do so
        if (this.config.monitoring.runOnStart !== false) {
            setTimeout(() => {
                this.runMonitoring().catch(console.error);
            }, 5000); // Wait 5 seconds then run first check
        }

        console.log('✅ Monitoring scheduler started');
        return true;
    }

    stop() {
        if (this.task) {
            this.task.destroy();
            this.task = null;
            console.log('🛑 Monitoring scheduler stopped');
            return true;
        }
        return false;
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            isScheduled: !!this.task,
            config: this.config,
            stats: this.stats,
            nextRun: this.task ? 'N/A (cron schedule)' : null
        };
    }

    logSummary(result, duration) {
        const summary = {
            timestamp: new Date().toISOString(),
            duration: duration,
            products: {
                new: result.changes.newProducts.length,
                removed: result.changes.removedProducts.length,
                priceChanges: result.changes.priceChanges.length,
                availabilityChanges: result.changes.availabilityChanges.length
            },
            alerts: result.alerts.length,
            runNumber: this.stats.runsCompleted
        };

        const summaryFile = path.join(__dirname, '../../data/monitoring-summary.jsonl');
        
        try {
            fs.appendFileSync(summaryFile, JSON.stringify(summary) + '\n');
        } catch (error) {
            console.error('Failed to write summary log:', error.message);
        }
    }

    async testRun() {
        console.log('🧪 Running test monitoring (no scheduling)...');
        return await this.runMonitoring();
    }
}

module.exports = MonitorScheduler;