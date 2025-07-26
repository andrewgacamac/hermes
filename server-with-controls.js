const express = require('express');
const path = require('path');
const PicotinMonitor = require('./lib/monitoring/picotin-monitor');

const app = express();
const PORT = process.env.PORT || 3000;

// Monitor state
let monitor = null;
let monitorInterval = null;
let startTime = null;
let isRunning = false;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the search log JSON file
app.get('/search-log.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search-log.json'));
});

// API endpoint to get monitor status
app.get('/api/status', (req, res) => {
    res.json({
        isRunning: isRunning,
        startTime: startTime,
        elapsedTime: startTime ? Date.now() - startTime : 0,
        intervalMinutes: process.env.MONITOR_INTERVAL_MINUTES || 5,
        businessHoursOnly: process.env.MONITOR_BUSINESS_HOURS_ONLY === 'true',
        currentTime: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    });
});

// API endpoint to start monitoring
app.post('/api/start', async (req, res) => {
    if (isRunning) {
        return res.json({ success: false, message: 'Monitor already running' });
    }
    
    try {
        console.log('🚀 Starting Picotin monitor via web interface...');
        
        monitor = new PicotinMonitor();
        startTime = Date.now();
        isRunning = true;
        
        // Send startup notification
        await monitor.sendStartupNotification();
        
        // Run first search
        await monitor.searchForPicotin();
        
        // Track if we've sent the 9 AM notification today
        let lastDailyNotificationDate = null;
        
        // Set up interval
        const intervalMinutes = parseInt(process.env.MONITOR_INTERVAL_MINUTES) || 5;
        monitorInterval = setInterval(async () => {
            // Check business hours if configured
            if (process.env.MONITOR_BUSINESS_HOURS_ONLY === 'true') {
                const nowEST = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
                const now = new Date(nowEST);
                const hour = now.getHours();
                const minute = now.getMinutes();
                const day = now.getDay();
                const today = now.toDateString();
                
                // Send 9 AM notification
                if (hour === 9 && minute < 5 && day >= 1 && day <= 5 && lastDailyNotificationDate !== today) {
                    await monitor.sendDailyNotification();
                    lastDailyNotificationDate = today;
                }
                
                const startHour = parseInt(process.env.MONITOR_START_HOUR) || 9;
                const endHour = parseInt(process.env.MONITOR_END_HOUR) || 18;
                
                if (day === 0 || day === 6) {
                    console.log(`⏰ Skipping - weekend (${now.toLocaleString()})`);
                    return;
                }
                
                if (hour < startHour || hour >= endHour) {
                    console.log(`⏰ Skipping - outside business hours (${now.toLocaleString()})`);
                    return;
                }
            }
            
            await monitor.searchForPicotin();
            
        }, intervalMinutes * 60 * 1000);
        
        res.json({ success: true, message: 'Monitor started successfully' });
        
    } catch (error) {
        console.error('Error starting monitor:', error);
        isRunning = false;
        startTime = null;
        res.json({ success: false, message: error.message });
    }
});

// API endpoint to stop monitoring
app.post('/api/stop', (req, res) => {
    if (!isRunning) {
        return res.json({ success: false, message: 'Monitor not running' });
    }
    
    try {
        console.log('🛑 Stopping Picotin monitor via web interface...');
        
        if (monitorInterval) {
            clearInterval(monitorInterval);
            monitorInterval = null;
        }
        
        monitor = null;
        isRunning = false;
        startTime = null;
        
        res.json({ success: true, message: 'Monitor stopped successfully' });
        
    } catch (error) {
        console.error('Error stopping monitor:', error);
        res.json({ success: false, message: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        monitoring: {
            isRunning: isRunning,
            uptime: startTime ? Date.now() - startTime : 0
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`📊 View logs and controls at http://localhost:${PORT}/`);
    console.log(`🎮 Use web interface to start/stop monitoring`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (monitorInterval) {
        clearInterval(monitorInterval);
    }
    process.exit(0);
});