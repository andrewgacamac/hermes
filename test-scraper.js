const HermesScraper = require('./lib/scraper/hermes-scraper');

async function testHermesScraper() {
    console.log('🔍 Testing Hermès scraper...');
    
    const scraper = new HermesScraper();
    
    try {
        // First, let's get the page structure to understand the layout
        console.log('\n📋 Getting page structure...');
        const structure = await scraper.getPageStructure();
        console.log('Page structure:', JSON.stringify(structure, null, 2));
        
        // Now try to scrape products
        console.log('\n🛍️ Scraping products...');
        const result = await scraper.scrapeBagsPage();
        
        if (result.success) {
            console.log(`✅ Successfully scraped ${result.productCount} products`);
            console.log('\n📦 Products found:');
            
            result.products.forEach((product, index) => {
                console.log(`\n${index + 1}. ${product.name || 'No name'}`);
                console.log(`   Price: ${product.price || 'No price'}`);
                console.log(`   Link: ${product.link || 'No link'}`);
                console.log(`   Availability: ${product.availability}`);
                if (product.image) {
                    console.log(`   Image: ${product.image}`);
                }
            });
            
            // Save results to file for inspection
            const fs = require('fs');
            fs.writeFileSync('./scraping-results.json', JSON.stringify(result, null, 2));
            console.log('\n💾 Results saved to scraping-results.json');
            
        } else {
            console.log('❌ Scraping failed:', result.error);
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    } finally {
        await scraper.close();
        console.log('\n🔒 Browser closed');
    }
}

testHermesScraper();