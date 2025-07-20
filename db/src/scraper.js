const express = require('express');
const { get_driver } = require('./amazon-auth');
const { getCompetitorAsins, getDescription } = require('./asins');
const { getCriticalReviews, getPositiveReviews } = require('./reviews');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection string
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbms_schema';
let mongoClient;

// Connect to MongoDB
async function connectDB() {
    if (!mongoClient) {
        mongoClient = new MongoClient(mongoURI);
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    }
    return mongoClient.db('adbms_schema');
}

// Middleware to parse JSON requests
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Scrape endpoint
app.post('/scrape', async (req, res) => {
    const NUMBER_OF_CRITICAL_REVIEWS = 50;
    const NUMBER_OF_POSITIVE_REVIEWS = 50;
    // Check both query params and body params
    const keyword = req.query.keyword || req.body.keyword;
    const asin = req.query.asin || req.body.asin;

    // Initialize drivers array outside the conditional blocks
    let mainDriver;
    const drivers = [];

    // Validate input
    if (!keyword || !asin) {
        return res.status(400).json({ error: 'Both keyword and asin are required' });
    }

    try {
        // Connect to MongoDB first to check for existing data
        const db = await connectDB();
        const descriptionsCollection = db.collection('descriptions');
        const reviewsCollection = db.collection('reviews');
        const searchResultsCollection = db.collection('search_results');

        // Check if we already have search results for this keyword and asin
        const existingSearch = await searchResultsCollection.findOne({
            keyword: keyword,
            excluded_asin: asin
        });

        if (existingSearch) {
            console.log(`Found existing search results for keyword: ${keyword} and asin: ${asin}`);

            // Get all ASINs (competitors + excluded)
            const allAsins = [...existingSearch.competitor_asins];
            if (asin && asin.trim() !== '') {
                allAsins.push(asin);
            }

            // Fetch descriptions for all ASINs
            const descriptions = await descriptionsCollection
                .find({ asin: { $in: allAsins } })
                .toArray();

            // Create a map for easier access
            const descriptionsMap = {};
            descriptions.forEach(desc => {
                descriptionsMap[desc.asin] = desc;
            });

            // Fetch reviews for all ASINs
            const reviews = await reviewsCollection
                .find({ asin: { $in: allAsins } })
                .toArray();

            // Group reviews by ASIN and type
            const reviewsMap = {};
            allAsins.forEach(asin => {
                reviewsMap[asin] = {
                    critical: reviews.filter(r => r.asin === asin && r.review_type === 'critical'),
                    positive: reviews.filter(r => r.asin === asin && r.review_type === 'positive')
                };
            });

            // Return the data from MongoDB without starting any browser instances
            return res.status(200).json({
                success: true,
                source: 'database',
                keyword,
                excludedAsin: asin,
                competitorAsins: existingSearch.competitor_asins,
                descriptions: descriptionsMap,
                reviews: reviewsMap
            });
        }

        // If we don't have existing data, proceed with scraping
        console.log(`No existing data found for keyword: ${keyword} and asin: ${asin}. Proceeding with scraping.`);

        // Initialize primary browser with cookies
        mainDriver = await get_driver();
        const mainBrowser = mainDriver.browser;
        const mainPage = mainDriver.page;

        // After getting competitor ASINs
        const competitorAsins = await getCompetitorAsins(mainPage, keyword, asin);
        console.log('Competitor ASINs:', competitorAsins);

        // Store search results data
        const searchResult = {
            keyword: keyword,
            excluded_asin: asin,
            competitor_asins: competitorAsins,
            timestamp: new Date()
        };

        // Insert the search result
        await searchResultsCollection.insertOne(searchResult);
        console.log(`Stored search results for keyword: ${keyword}`);

        // Combine all ASINs including the excluded one
        const allAsins = [...competitorAsins];
        if (asin && asin.trim() !== '') {
            allAsins.push(asin);
        }

        // Initialize all drivers in parallel (up to 6)
        const maxDrivers = Math.min(allAsins.length, 3);
        console.log(`Creating ${maxDrivers} browser instances for parallel processing (max 3)`);

        // Add main driver to the drivers array
        drivers.push(mainDriver);

        // Create additional drivers (already with cookies)
        const driverPromises = [];
        for (let i = 1; i < maxDrivers; i++) {
            driverPromises.push(get_driver());
        }

        const additionalDrivers = await Promise.all(driverPromises);
        drivers.push(...additionalDrivers);

        console.log(`Successfully created ${drivers.length} browser instances`);

        // Process ASINs in parallel
        const allReviews = {};
        const allDescriptions = {};

        // Map ASINs to drivers for processing
        const processingPromises = allAsins.map((currentAsin, index) => {
            // Use modulo to cycle through available drivers if we have more ASINs than drivers
            const driver = drivers[index % drivers.length];
            const currentPage = driver.page;
            const save_cookies = driver.save_cookies;

            return (async () => {
                try {
                    // Get product description
                    console.log(`\nDriver ${index % drivers.length + 1}: Collecting product description for ASIN: ${currentAsin}`);
                    const productDescription = await getDescription(currentPage, currentAsin);
                    if (!productDescription) {
                        console.warn(`⚠️ Skipping ASIN ${currentAsin} due to missing description`);
                        return;
                    }
                    allDescriptions[currentAsin] = productDescription;

                    // --- Improved review scraping ---
                    let criticalReviews = [];
                    let positiveReviews = [];
                    try {
                        console.log(`\nDriver ${index % drivers.length + 1}: Collecting critical reviews for ASIN: ${currentAsin}`);
                        await currentPage.waitForSelector('.review-text-content', { timeout: 15000 });
                        criticalReviews = await getCriticalReviews(currentPage, currentAsin, NUMBER_OF_CRITICAL_REVIEWS);
                    } catch (err) {
                        console.warn(`No critical reviews found for ASIN ${currentAsin}:`, err.message);
                    }
                    try {
                        console.log(`\nDriver ${index % drivers.length + 1}: Collecting positive reviews for ASIN: ${currentAsin}`);
                        await currentPage.waitForSelector('.review-text-content', { timeout: 15000 });
                        positiveReviews = await getPositiveReviews(currentPage, currentAsin, NUMBER_OF_POSITIVE_REVIEWS);
                    } catch (err) {
                        console.warn(`No positive reviews found for ASIN ${currentAsin}:`, err.message);
                    }

                    if (!criticalReviews.length && !positiveReviews.length) {
                        console.warn(`⚠️ No reviews found for ASIN ${currentAsin}`);
                    }

                    allReviews[currentAsin] = {
                        critical: criticalReviews,
                        positive: positiveReviews
                    };

                    console.log(`Driver ${index % drivers.length + 1}: Collected ${criticalReviews.length} critical and ${positiveReviews.length} positive reviews for ASIN: ${currentAsin}`);

                    // In scraper.js, add more detailed logging:
                    const productData = {
                        asin: currentAsin,
                        title: productDescription.title,
                        description: productDescription.bulletPoints,
                        timestamp: new Date()
                    };

                    // Add this log to see what's actually being stored
                    //console.log(`About to store imageUrl for ${currentAsin}: ${productDescription.imageUrl}`);

                    // Then proceed with your MongoDB operations - use descriptionsCollection instead
                    await descriptionsCollection.updateOne(
                        { asin: currentAsin },
                        { $set: productData },
                        { upsert: true }
                    );

                    console.log(`Driver ${index % drivers.length + 1}: Stored product data for ASIN: ${currentAsin}`);

                    // Store reviews in MongoDB
                    const allProductReviews = [
                        ...criticalReviews.map(review => ({ ...review, asin: currentAsin })),
                        ...positiveReviews.map(review => ({ ...review, asin: currentAsin }))
                    ];

                    if (allProductReviews.length > 0) {
                        const bulkOps = allProductReviews.map(review => ({
                            updateOne: {
                                filter: { review_id: review.review_id, asin: currentAsin },
                                update: { $set: review },
                                upsert: true
                            }
                        }));

                        await reviewsCollection.bulkWrite(bulkOps);
                        console.log(`Driver ${index % drivers.length + 1}: Stored ${allProductReviews.length} reviews for ASIN: ${currentAsin}`);
                    }

                    // Save cookies for this driver
                    await save_cookies();

                    return { asin: currentAsin, success: true };
                } catch (error) {
                    console.error(`Driver ${index % drivers.length + 1}: Error processing ASIN ${currentAsin}:`, error);
                    return { asin: currentAsin, success: false, error: error.message };
                }
            })();
        });

        // Wait for all ASINs to be processed
        await Promise.all(processingPromises);

        // Return the collected data
        res.status(200).json({
            success: true,
            source: 'scraping',
            keyword,
            excludedAsin: asin,
            competitorAsins,
            descriptions: allDescriptions,
            reviews: allReviews
        });

    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({
            error: 'Scraping failed',
            message: error.message
        });
    } finally {
        // Close all browsers if they exist and were opened
        for (const driver of drivers) {
            if (driver && driver.browser) {
                await driver.browser.close();
            }
        }
    }
});


// Start server
app.listen(port, () => {
    console.log(`Amazon review scraper API running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB connection closed');
    }
    process.exit(0);
});