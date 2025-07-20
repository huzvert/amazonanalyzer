/**
 * Retrieves competitor ASINs for a given keyword, excluding a specific ASIN
 * @param {Object} page - Playwright page object
 * @param {string} keyword - Search keyword
 * @param {string} excludeAsin - ASIN to exclude from results
 * @returns {Promise<string[]>} Array of competitor ASINs
 */
const { getSearchUrl } = require('./utils');

async function getCompetitorAsins(page, keyword, excludeAsin) {
    // Construct the search URL with sorting by popularity rank
    const searchUrl = getSearchUrl(keyword) + '&s=exact-aware-popularity-rank';

    // Navigate to the search page with retry and screenshot for debugging
    let retries = 3;
    for (let i = 0; i < retries; i++) {
        try {
            await page.goto(searchUrl, { timeout: 60000 });
            await page.waitForSelector('[data-asin]', { timeout: 30000 });
            // Take a screenshot for debugging
            await page.screenshot({ path: `debug-search-${Date.now()}.png` });
            break;
        } catch (e) {
            console.log("Page load or selector timeout. Retrying...", e.message);
            if (i === retries - 1) throw e;
        }
    }

    // Extract ASINs from the search results
    const asins = await page.$$eval('[data-asin]', (elements, excludeAsin) => {
        return elements
            .map(el => el.getAttribute('data-asin'))
            .filter(asin => asin && asin.length > 0 && asin !== excludeAsin)
            .slice(0, 6); // Get 6 in case one matches the excluded ASIN
    }, excludeAsin);

    // Return the first 5 unique ASINs that aren't the excluded one
    return [...new Set(asins)].slice(0, 5);
}

/**
 * Extracts product description and details from an Amazon product page
 * @param {Object} page - Playwright page object
 * @param {string} asin - Amazon Standard Identification Number
 * @returns {Promise<Object>} Product description data
 */

async function getDescription(page, asin) {

    // --- User-Agent rotation ---
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/15.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    if (page.context() && page.context().setExtraHTTPHeaders) {
        await page.context().setExtraHTTPHeaders({ 'User-Agent': randomUserAgent });
    }

    const productUrl = `https://www.amazon.com/dp/${asin}`;

    // --- Navigation with retry and selector waits ---
    try {
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForSelector('#productTitle', { timeout: 15000 });
    } catch (err) {
        console.warn(`⚠️ Retrying ASIN ${asin} after timeout...`);
        await new Promise(r => setTimeout(r, 3000));
        try {
            await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForSelector('#productTitle', { timeout: 15000 });
        } catch (error) {
            console.error(`❌ Timeout or selector error for ASIN ${asin}:`, error.message);
            return null;
        }
    }

    try {
        const title = await page.$eval('#productTitle', el => el.textContent?.trim() || '');
        const bulletPoints = await page.$$eval('#feature-bullets ul li span', els =>
            els.map(el => el.textContent?.trim()).filter(Boolean)
        );
        return { title, bulletPoints };
    } catch (error) {
        console.error(`Error extracting description for ASIN ${asin}:`, error.message);
        return null;
    }
}

module.exports = {
    getCompetitorAsins,
    getDescription
};