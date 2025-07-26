const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const SMSService = require('../sms');
const HtmlLogger = require('../logging/html-logger');

class HermesProductMonitor {
    constructor(options = {}) {
        this.baseUrl = 'https://www.hermes.com/ca/en';
        this.dataDir = path.join(__dirname, '../../data');
        this.previousDataFile = path.join(this.dataDir, 'previous-products.json');
        this.logFile = path.join(this.dataDir, 'monitoring.log');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        this.smsService = new SMSService();
        this.htmlLogger = new HtmlLogger();
        this.alertSettings = {
            newProducts: true,
            priceChanges: true,
            availabilityChanges: true,
            targetProducts: [], // Specific products to monitor
            maxPrice: null, // Alert only for products under this price
            minPrice: null, // Alert only for products over this price
            ...options
        };
    }

    async scrapeCurrentProducts() {
        try {
            const url = `${this.baseUrl}/category/women/bags-and-small-leather-goods/bags-and-clutches/`;
            
            this.log(`Scraping products from: ${url}`);
            
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
            
            // Use the same successful selector from our working scraper
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
                
                // Extract product ID from link for consistent tracking
                const productId = link ? link.split('/').pop() : `product-${index}`;
                
                // Parse numerical price
                const priceMatch = price.match(/CA\$([0-9,]+)/);
                const numericPrice = priceMatch ? parseInt(priceMatch[1].replace(',', '')) : null;
                
                // Check availability
                const availabilityText = $item.text().toLowerCase();
                let availability = 'unknown';
                if (availabilityText.includes('available')) availability = 'available';
                else if (availabilityText.includes('out of stock')) availability = 'out of stock';
                else if (availabilityText.includes('sold out')) availability = 'sold out';
                
                if (name) {
                    products.push({
                        id: productId,
                        name: name,
                        price: numericPrice,
                        priceText: price,
                        colors: colors,
                        link: link,
                        availability: availability,
                        lastSeen: new Date().toISOString()
                    });
                }
            });
            
            this.log(`Found ${products.length} products`);
            
            // Log to HTML
            if (products.length > 0) {
                this.htmlLogger.logSearch(true, `Scraped Hermès bags page successfully`, {
                    productsFound: products.length
                });
            }
            
            // If no products found with primary selector, try debugging
            if (products.length === 0) {
                this.log('No products found with primary selector, trying debug...', 'WARN');
                
                // Check if the page loaded correctly
                const title = $('title').text();
                this.log(`Page title: ${title}`);
                
                // Try alternative selectors
                const alternativeSelectors = [
                    '.product-item',
                    '[class*="product"]',
                    'a[href*="/product/"]'
                ];
                
                for (const selector of alternativeSelectors) {
                    const elements = $(selector);
                    this.log(`Selector ${selector}: ${elements.length} elements found`);
                    
                    if (elements.length > 0) {
                        // Try to extract some data from the first few elements
                        elements.slice(0, 3).each((i, el) => {
                            const text = $(el).text().trim().substring(0, 100);
                            this.log(`  Element ${i + 1}: ${text}...`);
                        });
                    }
                }
            }
            
            return products;
            
        } catch (error) {
            this.log(`Error scraping products: ${error.message}`, 'ERROR');
            this.htmlLogger.logError('Failed to scrape Hermès page', error.message);
            throw error;
        }
    }

    async detectChanges() {
        try {
            const currentProducts = await this.scrapeCurrentProducts();
            const previousProducts = this.loadPreviousData();
            
            const changes = {
                newProducts: [],
                removedProducts: [],
                priceChanges: [],
                availabilityChanges: [],
                timestamp: new Date().toISOString()
            };
            
            // Create lookup maps
            const currentMap = new Map(currentProducts.map(p => [p.id, p]));
            const previousMap = new Map(previousProducts.map(p => [p.id, p]));
            
            // Detect new products
            for (const [id, product] of currentMap) {
                if (!previousMap.has(id)) {
                    changes.newProducts.push(product);
                }
            }
            
            // Detect removed products
            for (const [id, product] of previousMap) {
                if (!currentMap.has(id)) {
                    changes.removedProducts.push(product);
                }
            }
            
            // Detect price and availability changes
            for (const [id, currentProduct] of currentMap) {
                const previousProduct = previousMap.get(id);
                if (previousProduct) {
                    // Price changes
                    if (currentProduct.price !== previousProduct.price) {
                        changes.priceChanges.push({
                            product: currentProduct,
                            previousPrice: previousProduct.price,
                            newPrice: currentProduct.price,
                            change: currentProduct.price - previousProduct.price
                        });
                    }
                    
                    // Availability changes
                    if (currentProduct.availability !== previousProduct.availability) {
                        changes.availabilityChanges.push({
                            product: currentProduct,
                            previousAvailability: previousProduct.availability,
                            newAvailability: currentProduct.availability
                        });
                    }
                }
            }
            
            // Save current data for next comparison
            this.savePreviousData(currentProducts);
            
            this.log(`Changes detected: ${changes.newProducts.length} new, ${changes.removedProducts.length} removed, ${changes.priceChanges.length} price changes, ${changes.availabilityChanges.length} availability changes`);
            
            return changes;
            
        } catch (error) {
            this.log(`Error detecting changes: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async sendAlerts(changes) {
        const alerts = [];
        
        // New products alerts
        if (this.alertSettings.newProducts && changes.newProducts.length > 0) {
            for (const product of changes.newProducts) {
                if (this.shouldAlert(product)) {
                    const message = `🆕 NEW HERMÈS BAG: ${product.name} - ${product.priceText} - ${product.colors}. Link: ${product.link}`;
                    alerts.push({ type: 'new', product, message });
                }
            }
        }
        
        // Price changes alerts
        if (this.alertSettings.priceChanges && changes.priceChanges.length > 0) {
            for (const change of changes.priceChanges) {
                if (this.shouldAlert(change.product)) {
                    const direction = change.change > 0 ? '📈 PRICE INCREASE' : '📉 PRICE DROP';
                    const message = `${direction}: ${change.product.name} - Was CA$${change.previousPrice?.toLocaleString()}, Now ${change.product.priceText}`;
                    alerts.push({ type: 'price', product: change.product, message });
                }
            }
        }
        
        // Availability changes alerts
        if (this.alertSettings.availabilityChanges && changes.availabilityChanges.length > 0) {
            for (const change of changes.availabilityChanges) {
                if (this.shouldAlert(change.product)) {
                    let emoji = '📦';
                    if (change.newAvailability === 'available') emoji = '✅';
                    else if (change.newAvailability === 'out of stock') emoji = '❌';
                    
                    const message = `${emoji} AVAILABILITY CHANGE: ${change.product.name} - Now ${change.newAvailability.toUpperCase()}. Link: ${change.product.link}`;
                    alerts.push({ type: 'availability', product: change.product, message });
                }
            }
        }
        
        // Send SMS alerts
        for (const alert of alerts) {
            try {
                const result = await this.smsService.sendSMS(
                    process.env.TEST_RECIPIENT_NUMBER,
                    alert.message
                );
                
                if (result.success) {
                    this.log(`SMS sent: ${alert.type} alert for ${alert.product.name}`);
                } else {
                    this.log(`Failed to send SMS: ${result.error}`, 'ERROR');
                }
                
                // Add delay between messages to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                this.log(`Error sending SMS alert: ${error.message}`, 'ERROR');
            }
        }
        
        return alerts;
    }

    shouldAlert(product) {
        // Check target products filter
        if (this.alertSettings.targetProducts.length > 0) {
            const isTargeted = this.alertSettings.targetProducts.some(target => 
                product.name.toLowerCase().includes(target.toLowerCase())
            );
            if (!isTargeted) return false;
        }
        
        // Check price filters
        if (this.alertSettings.maxPrice && product.price > this.alertSettings.maxPrice) {
            return false;
        }
        
        if (this.alertSettings.minPrice && product.price < this.alertSettings.minPrice) {
            return false;
        }
        
        return true;
    }

    loadPreviousData() {
        try {
            if (fs.existsSync(this.previousDataFile)) {
                const data = fs.readFileSync(this.previousDataFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            this.log(`Error loading previous data: ${error.message}`, 'ERROR');
        }
        return [];
    }

    savePreviousData(products) {
        try {
            fs.writeFileSync(this.previousDataFile, JSON.stringify(products, null, 2));
            this.log(`Saved ${products.length} products to previous data file`);
        } catch (error) {
            this.log(`Error saving previous data: ${error.message}`, 'ERROR');
        }
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(logEntry.trim());
        
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    async runMonitoring() {
        try {
            this.log('Starting product monitoring...');
            
            const changes = await this.detectChanges();
            const alerts = await this.sendAlerts(changes);
            
            this.log(`Monitoring complete. Sent ${alerts.length} alerts.`);
            
            // Log to HTML
            this.htmlLogger.logMonitoringRun({ 
                changes, 
                alerts,
                productCount: (await this.scrapeCurrentProducts()).length
            });
            
            return { changes, alerts };
            
        } catch (error) {
            this.log(`Monitoring failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

module.exports = HermesProductMonitor;