const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class HermesScraper {
    constructor(options = {}) {
        this.baseUrl = 'https://www.hermes.com/ca/en';
        this.options = {
            headless: true,
            timeout: 30000,
            ...options
        };
    }

    async launch() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: this.options.headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            });
        }
        return this.browser;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async scrapeBagsPage() {
        try {
            await this.launch();
            const page = await this.browser.newPage();
            
            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // Navigate to bags page
            const url = `${this.baseUrl}/category/women/bags-and-small-leather-goods/bags-and-clutches/`;
            console.log(`Navigating to: ${url}`);
            
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: this.options.timeout 
            });

            // Wait for products to load
            await page.waitForTimeout(3000);

            // Try to find and click "Load More" or similar buttons
            try {
                await this.loadMoreProducts(page);
            } catch (error) {
                console.log('Could not load more products:', error.message);
            }

            // Get page content
            const content = await page.content();
            const $ = cheerio.load(content);

            // Extract products using multiple selectors
            const products = this.extractProducts($);
            
            await page.close();
            
            return {
                success: true,
                url: url,
                timestamp: new Date().toISOString(),
                productCount: products.length,
                products: products
            };

        } catch (error) {
            console.error('Error scraping Hermès bags page:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async loadMoreProducts(page) {
        // Try different selectors for "Load More" buttons
        const loadMoreSelectors = [
            '[data-testid="load-more"]',
            '.load-more',
            '[class*="load-more"]',
            '[class*="LoadMore"]',
            'button[class*="more"]',
            'a[class*="more"]'
        ];

        for (const selector of loadMoreSelectors) {
            try {
                const button = await page.$(selector);
                if (button) {
                    await button.click();
                    await page.waitForTimeout(2000);
                    console.log(`Clicked load more button: ${selector}`);
                    break;
                }
            } catch (error) {
                // Continue to next selector
            }
        }
    }

    extractProducts($) {
        const products = [];
        
        // Multiple selectors to try for product containers
        const productSelectors = [
            '[data-testid="product-item"]',
            '.product-item',
            '.product-card',
            '[class*="product"]',
            '[class*="Product"]',
            '.grid-item',
            '[data-automation-id*="product"]'
        ];

        let foundProducts = false;
        
        for (const selector of productSelectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`Found ${items.length} products using selector: ${selector}`);
                foundProducts = true;
                
                items.each((index, element) => {
                    const product = this.extractProductData($, element);
                    if (product.name) {
                        products.push(product);
                    }
                });
                break;
            }
        }

        if (!foundProducts) {
            // Fallback: look for any elements that might contain product info
            console.log('No products found with standard selectors, trying fallback...');
            this.fallbackProductExtraction($, products);
        }

        return products;
    }

    extractProductData($, element) {
        const $element = $(element);
        
        // Try multiple selectors for product name
        const nameSelectors = [
            '.product-name',
            '.product-title',
            '[data-testid="product-name"]',
            'h2', 'h3', 'h4',
            '[class*="title"]',
            '[class*="name"]'
        ];

        // Try multiple selectors for price
        const priceSelectors = [
            '.price',
            '.product-price',
            '[data-testid="price"]',
            '[class*="price"]',
            '[class*="Price"]'
        ];

        // Try multiple selectors for links
        const linkSelectors = [
            'a[href*="/product/"]',
            'a[href*="/item/"]',
            'a',
            '[data-testid="product-link"]'
        ];

        let name = '';
        let price = '';
        let link = '';
        let image = '';

        // Extract name
        for (const selector of nameSelectors) {
            const nameEl = $element.find(selector).first();
            if (nameEl.length && nameEl.text().trim()) {
                name = nameEl.text().trim();
                break;
            }
        }

        // Extract price
        for (const selector of priceSelectors) {
            const priceEl = $element.find(selector).first();
            if (priceEl.length && priceEl.text().trim()) {
                price = priceEl.text().trim();
                break;
            }
        }

        // Extract link
        for (const selector of linkSelectors) {
            const linkEl = $element.find(selector).first();
            if (linkEl.length && linkEl.attr('href')) {
                link = linkEl.attr('href');
                if (link && !link.startsWith('http')) {
                    link = this.baseUrl + link;
                }
                break;
            }
        }

        // Extract image
        const imgEl = $element.find('img').first();
        if (imgEl.length && imgEl.attr('src')) {
            image = imgEl.attr('src');
        }

        return {
            name: name,
            price: price,
            link: link,
            image: image,
            availability: this.extractAvailability($element)
        };
    }

    extractAvailability($element) {
        const availabilityTexts = [
            'in stock',
            'available',
            'out of stock',
            'sold out',
            'coming soon'
        ];

        const text = $element.text().toLowerCase();
        for (const availText of availabilityTexts) {
            if (text.includes(availText)) {
                return availText;
            }
        }

        return 'unknown';
    }

    fallbackProductExtraction($, products) {
        // Look for any links that might be products
        $('a[href*="/product/"], a[href*="/item/"]').each((index, element) => {
            const $element = $(element);
            const href = $element.attr('href');
            const text = $element.text().trim();
            
            if (text && href) {
                products.push({
                    name: text,
                    price: '',
                    link: href.startsWith('http') ? href : this.baseUrl + href,
                    image: '',
                    availability: 'unknown'
                });
            }
        });
    }

    async getPageStructure() {
        try {
            await this.launch();
            const page = await this.browser.newPage();
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            const url = `${this.baseUrl}/category/women/bags-and-small-leather-goods/bags-and-clutches/`;
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: this.options.timeout 
            });

            await page.waitForTimeout(3000);

            // Get all unique class names and IDs that might contain products
            const structure = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const classes = new Set();
                const ids = new Set();
                
                elements.forEach(el => {
                    if (el.className && typeof el.className === 'string') {
                        el.className.split(' ').forEach(cls => {
                            if (cls.toLowerCase().includes('product') || 
                                cls.toLowerCase().includes('item') ||
                                cls.toLowerCase().includes('card')) {
                                classes.add(cls);
                            }
                        });
                    }
                    if (el.id && (el.id.toLowerCase().includes('product') || 
                                  el.id.toLowerCase().includes('item'))) {
                        ids.add(el.id);
                    }
                });
                
                return {
                    classes: Array.from(classes),
                    ids: Array.from(ids),
                    title: document.title,
                    url: window.location.href
                };
            });

            await page.close();
            return structure;

        } catch (error) {
            console.error('Error getting page structure:', error);
            return { error: error.message };
        }
    }
}

module.exports = HermesScraper;