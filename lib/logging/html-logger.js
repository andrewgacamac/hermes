const fs = require('fs');
const path = require('path');

class HtmlLogger {
    constructor() {
        this.logFile = path.join(__dirname, '../../public/search-log.json');
        this.maxLogs = 1000;
        
        // Ensure public directory exists
        const publicDir = path.dirname(this.logFile);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Initialize log file if it doesn't exist
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, JSON.stringify([]), 'utf8');
        }
    }
    
    addLog(logEntry) {
        try {
            // Read existing logs
            let logs = this.readLogs();
            
            // Add new entry at the beginning with timestamp
            const newEntry = {
                timestamp: new Date().toISOString(),
                timestampEST: new Date().toLocaleString('en-US', { 
                    timeZone: 'America/New_York',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                ...logEntry
            };
            
            logs.unshift(newEntry);
            
            // Keep only the last MAX_LOGS entries
            if (logs.length > this.maxLogs) {
                logs = logs.slice(0, this.maxLogs);
            }
            
            // Write back to file
            fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2), 'utf8');
            
            console.log(`[HTML Logger] Added log entry: ${logEntry.message}`);
            
            return true;
        } catch (error) {
            console.error('[HTML Logger] Error adding log:', error.message);
            return false;
        }
    }
    
    readLogs() {
        try {
            const data = fs.readFileSync(this.logFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('[HTML Logger] Error reading logs:', error.message);
            return [];
        }
    }
    
    logSearch(success, message, details = {}) {
        return this.addLog({
            success,
            message,
            ...details
        });
    }
    
    logMonitoringRun(result) {
        const changes = result.changes;
        const alerts = result.alerts;
        
        const totalChanges = (changes.newProducts?.length || 0) + 
                           (changes.priceChanges?.length || 0) + 
                           (changes.availabilityChanges?.length || 0);
        
        let message = `Monitored Hermès bags page`;
        
        if (totalChanges > 0) {
            const parts = [];
            if (changes.newProducts?.length > 0) {
                parts.push(`${changes.newProducts.length} new products`);
            }
            if (changes.priceChanges?.length > 0) {
                parts.push(`${changes.priceChanges.length} price changes`);
            }
            if (changes.availabilityChanges?.length > 0) {
                parts.push(`${changes.availabilityChanges.length} availability changes`);
            }
            message += ` - Found ${parts.join(', ')}`;
        } else {
            message += ' - No changes detected';
        }
        
        return this.addLog({
            success: true,
            message,
            productsFound: result.productCount || 0,
            newItems: changes.newProducts?.length || 0,
            priceChanges: changes.priceChanges?.length || 0,
            availabilityChanges: changes.availabilityChanges?.length || 0,
            alertsSent: alerts?.length || 0
        });
    }
    
    logError(message, error) {
        return this.addLog({
            success: false,
            message: `${message}: ${error}`,
            error: error
        });
    }
    
    getStats() {
        const logs = this.readLogs();
        const totalSearches = logs.length;
        const successfulSearches = logs.filter(log => log.success).length;
        const totalAlerts = logs.reduce((sum, log) => sum + (log.alertsSent || 0), 0);
        
        return {
            totalSearches,
            successfulSearches,
            failedSearches: totalSearches - successfulSearches,
            successRate: totalSearches > 0 ? (successfulSearches / totalSearches * 100).toFixed(1) : 0,
            totalAlerts,
            lastCheck: logs.length > 0 ? logs[0].timestamp : null
        };
    }
}

module.exports = HtmlLogger;