const axios = require('axios');
const cheerio = require('cheerio');

async function testSimpleScraper() {
    console.log('🔍 Testing simple Hermès scraper with axios...');
    
    try {
        const url = 'https://www.hermes.com/ca/en/category/women/bags-and-small-leather-goods/bags-and-clutches/';
        
        console.log(`📡 Fetching: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        });
        
        console.log(`✅ Response status: ${response.status}`);
        console.log(`📄 Content length: ${response.data.length} characters`);
        
        const $ = cheerio.load(response.data);
        
        // Get page title
        const title = $('title').text();
        console.log(`📋 Page title: ${title}`);
        
        // Look for any elements that might contain products
        console.log('\n🔍 Analyzing page structure...');
        
        // Check for common product-related selectors
        const selectors = [
            '.product',
            '.item',
            '.card',
            '[class*="product"]',
            '[class*="Product"]',
            '[class*="item"]',
            '[class*="Item"]',
            '[data-testid*="product"]',
            '[data-automation-id*="product"]'
        ];
        
        selectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`  ${selector}: ${elements.length} elements found`);
                
                // Sample the first few elements
                elements.slice(0, 3).each((index, element) => {
                    const text = $(element).text().trim().substring(0, 100);
                    console.log(`    ${index + 1}. ${text}...`);
                });
            }
        });
        
        // Look for any links that might be products
        const productLinks = $('a[href*="/product/"], a[href*="/item/"]');
        console.log(`\n🔗 Product-like links found: ${productLinks.length}`);
        
        productLinks.slice(0, 10).each((index, element) => {
            const href = $(element).attr('href');
            const text = $(element).text().trim();
            console.log(`  ${index + 1}. ${text} -> ${href}`);
        });
        
        // Look for price-related elements
        const priceElements = $('[class*="price"], [class*="Price"]');
        console.log(`\n💰 Price-like elements found: ${priceElements.length}`);
        
        priceElements.slice(0, 5).each((index, element) => {
            const text = $(element).text().trim();
            console.log(`  ${index + 1}. ${text}`);
        });
        
        // Save the HTML for manual inspection
        const fs = require('fs');
        fs.writeFileSync('./hermes-page.html', response.data);
        console.log('\n💾 Page HTML saved to hermes-page.html');
        
        // Extract all class names for analysis
        const allClasses = new Set();
        $('*').each((index, element) => {
            const className = $(element).attr('class');
            if (className) {
                className.split(' ').forEach(cls => {
                    if (cls.toLowerCase().includes('product') || 
                        cls.toLowerCase().includes('item') ||
                        cls.toLowerCase().includes('card') ||
                        cls.toLowerCase().includes('bag')) {
                        allClasses.add(cls);
                    }
                });
            }
        });
        
        console.log('\n📊 Relevant class names found:');
        Array.from(allClasses).slice(0, 20).forEach(cls => {
            console.log(`  .${cls}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Headers:`, error.response.headers);
        }
    }
}

testSimpleScraper();