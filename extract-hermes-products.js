const axios = require('axios');
const cheerio = require('cheerio');

async function extractHermesProducts() {
    console.log('🛍️ Extracting Hermès products...');
    
    try {
        const url = 'https://www.hermes.com/ca/en/category/women/bags-and-small-leather-goods/bags-and-clutches/';
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        const products = [];
        
        // Based on our analysis, use the product-grid-list-item selector
        $('.product-grid-list-item').each((index, element) => {
            const $item = $(element);
            
            // Extract product name
            const name = $item.find('.product-item-name, .product-title').text().trim();
            
            // Extract price
            const price = $item.find('.product-item-price').text().trim();
            
            // Extract product link
            const linkElement = $item.find('a[href*="/product/"]');
            let link = linkElement.attr('href');
            if (link && !link.startsWith('http')) {
                link = 'https://www.hermes.com' + link;
            }
            
            // Extract colors/variations
            const colors = $item.find('.product-item-colors').text().trim();
            
            // Extract image
            const img = $item.find('img').first();
            let image = img.attr('src') || img.attr('data-src');
            if (image && !image.startsWith('http')) {
                image = 'https:' + image;
            }
            
            // Check availability
            const availabilityText = $item.text().toLowerCase();
            let availability = 'unknown';
            if (availabilityText.includes('available')) availability = 'available';
            else if (availabilityText.includes('out of stock')) availability = 'out of stock';
            else if (availabilityText.includes('sold out')) availability = 'sold out';
            
            if (name) {
                products.push({
                    name: name,
                    price: price,
                    colors: colors,
                    link: link,
                    image: image,
                    availability: availability,
                    scrapedAt: new Date().toISOString()
                });
            }
        });
        
        console.log(`✅ Found ${products.length} products`);
        
        // Display products
        products.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name}`);
            console.log(`   💰 Price: ${product.price}`);
            console.log(`   🎨 Colors: ${product.colors}`);
            console.log(`   🔗 Link: ${product.link}`);
            console.log(`   📸 Image: ${product.image ? 'Yes' : 'No'}`);
            console.log(`   📦 Availability: ${product.availability}`);
        });
        
        // Save to JSON file
        const fs = require('fs');
        const results = {
            url: url,
            scrapedAt: new Date().toISOString(),
            productCount: products.length,
            products: products
        };
        
        fs.writeFileSync('./hermes-products.json', JSON.stringify(results, null, 2));
        console.log(`\n💾 Products saved to hermes-products.json`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Error extracting products:', error.message);
        return null;
    }
}

extractHermesProducts();