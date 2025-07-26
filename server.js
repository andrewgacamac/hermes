const express = require('express');
const path = require('path');
const MonitorScheduler = require('./lib/scheduler/monitor-scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Serve the search log JSON file
app.get('/search-log.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search-log.json'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        monitoring: scheduler ? scheduler.getStatus() : null
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`📊 View logs at http://localhost:${PORT}/`);
});

// Start the monitoring scheduler
console.log('🚀 Starting Hermès monitoring...');
const scheduler = new MonitorScheduler();
scheduler.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    scheduler.stop();
    process.exit(0);
});