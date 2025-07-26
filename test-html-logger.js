const HtmlLogger = require('./lib/logging/html-logger');

async function testHtmlLogger() {
    console.log('🧪 Testing HTML Logger...');
    
    const logger = new HtmlLogger();
    
    // Add some test entries
    console.log('\n📝 Adding test log entries...');
    
    // Successful search
    logger.logSearch(true, 'Scraped Hermès bags page successfully', {
        productsFound: 48,
        newItems: 2,
        alertsSent: 2
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Another successful search with no changes
    logger.logSearch(true, 'Scraped Hermès bags page - no changes detected', {
        productsFound: 48,
        newItems: 0,
        alertsSent: 0
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Failed search
    logger.logError('Failed to scrape Hermès page', 'Connection timeout');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Monitoring run with changes
    logger.logMonitoringRun({
        changes: {
            newProducts: [{ name: 'Kelly Bag' }, { name: 'Birkin Bag' }],
            priceChanges: [{ product: { name: 'Bolide Bag' } }],
            availabilityChanges: []
        },
        alerts: [1, 2, 3],
        productCount: 48
    });
    
    // Get and display stats
    console.log('\n📊 Logger Stats:');
    const stats = logger.getStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Read all logs
    console.log('\n📋 All Logs:');
    const logs = logger.readLogs();
    logs.forEach((log, index) => {
        console.log(`${index + 1}. [${new Date(log.timestamp).toLocaleString()}] ${log.success ? '✅' : '❌'} ${log.message}`);
    });
    
    console.log('\n✅ HTML logger test complete!');
    console.log('📁 Log file created at: public/search-log.json');
    console.log('🌐 To view in browser, run: npm run server');
}

testHtmlLogger();