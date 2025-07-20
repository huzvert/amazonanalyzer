/**
 * Gets critical reviews for a specific ASIN
 * @param {Object} page - Playwright page object
 * @param {string} asin - Product ASIN
 * @param {number} critTarget - Target number of critical reviews to collect (default: 30)
 * @returns {Promise<Array>} Array of critical reviews
 */
async function getCriticalReviews(page, asin, critTarget = 30) {
    const reviews = [];
    const baseUrl = `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent&filterByStar=critical`;
    const TIME_BETWEEN_PAGES = 1000;

    let pageNumber = 1;
    let attempts = 0;
    const maxAttempts = 3;

    try {
        // Navigate to critical reviews with correct waitUntil option
        console.log(`Navigating to ${baseUrl}`);
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

        // Wait for content to load
        await page.waitForTimeout(1000);

        // Check review count from the filter info element
        const reviewCountInfo = await page.evaluate(() => {
            const filterInfoElement = document.querySelector('div[data-hook="cr-filter-info-review-rating-count"]');
            if (!filterInfoElement) return { count: 0, text: 'Element not found' };

            const text = filterInfoElement.textContent.trim();
            if (text.includes('No matching customer reviews')) {
                return { count: 0, text };
            }

            const match = text.match(/(\d+)\s+matching customer reviews/);
            return { count: match ? parseInt(match[1], 10) : 0, text };
        });

        console.log(`Filter info text: "${reviewCountInfo.text}"`);

        if (reviewCountInfo.count === 0) {
            console.log(`No critical reviews found for ASIN ${asin}`);
            return [];
        }

        console.log(`Found ${reviewCountInfo.count} critical reviews for ASIN ${asin}`);

        // Continue with collecting reviews page by page
        while (reviews.length < critTarget && attempts < maxAttempts) {
            const currentUrl = `${baseUrl}&pageNumber=${pageNumber}`;
            console.log(`Fetching critical reviews: ${currentUrl}`);

            if (pageNumber > 1) {
                await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(2000);
            }

            // Extract the HTML content
            const content = await page.content();

            // Extract reviews
            const newReviews = await extractReviews(page);

            if (!newReviews || newReviews.length === 0) {
                console.log("No reviews found on this page");
                attempts++;
                if (attempts >= maxAttempts) {
                    console.log(`Reached maximum attempts (${maxAttempts}) without finding reviews`);
                    break;
                }
                continue;
            }

            // Reset attempts counter if we found reviews
            attempts = 0;
            reviews.push(...newReviews);

            console.log(`Found ${newReviews.length} reviews on page ${pageNumber}. Total so far: ${reviews.length}`);

            // Check if there's a next page
            const hasNextPage = await page.evaluate(() => {
                const nextPageElement = document.querySelector('ul.a-pagination li.a-last:not(.a-disabled)');
                return !!nextPageElement;
            });

            if (!hasNextPage) {
                console.log("No more pages with critical reviews.");
                break;
            }

            pageNumber++;

            // Add random delay between pages
            const randomDelay = TIME_BETWEEN_PAGES + Math.floor(Math.random() * 1000);
            await page.waitForTimeout(randomDelay);
        }

    } catch (error) {
        console.error(`Error while collecting reviews for ASIN ${asin}:`, error);
    }

    console.log(`Total critical reviews collected for ASIN ${asin}: ${reviews.length}`);
    return reviews.slice(0, critTarget);
}

async function getPositiveReviews(page, asin, posTarget = 30) {
    const reviews = [];
    const baseUrl = `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent&filterByStar=positive`;
    const TIME_BETWEEN_PAGES = 1500;

    let pageNumber = 1;
    let attempts = 0;
    const maxAttempts = 3;

    try {
        // Navigate to positive reviews
        console.log(`Navigating to ${baseUrl}`);
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Check review count from the filter info element
        const reviewCountInfo = await page.evaluate(() => {
            const filterInfoElement = document.querySelector('div[data-hook="cr-filter-info-review-rating-count"]');
            if (!filterInfoElement) return { count: 0, text: 'Element not found' };

            const text = filterInfoElement.textContent.trim();
            if (text.includes('No matching customer reviews')) {
                return { count: 0, text };
            }

            const match = text.match(/(\d+)\s+matching customer reviews/);
            return { count: match ? parseInt(match[1], 10) : 0, text };
        });

        console.log(`Filter info text: "${reviewCountInfo.text}"`);

        if (reviewCountInfo.count === 0) {
            console.log(`No positive reviews found for ASIN ${asin}`);
            return [];
        }

        console.log(`Found ${reviewCountInfo.count} positive reviews for ASIN ${asin}`);

        // Continue with collecting reviews page by page
        while (reviews.length < posTarget && attempts < maxAttempts) {
            const currentUrl = `${baseUrl}&pageNumber=${pageNumber}`;
            console.log(`Fetching positive reviews: ${currentUrl}`);

            if (pageNumber > 1) {
                await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(2000);
            }

            // Extract reviews
            const newReviews = await extractReviews(page, "positive");

            if (!newReviews || newReviews.length === 0) {
                console.log("No reviews found on this page");
                attempts++;
                if (attempts >= maxAttempts) {
                    console.log(`Reached maximum attempts (${maxAttempts}) without finding reviews`);
                    break;
                }
                continue;
            }

            // Reset attempts counter if we found reviews
            attempts = 0;
            reviews.push(...newReviews);

            console.log(`Found ${newReviews.length} reviews on page ${pageNumber}. Total so far: ${reviews.length}`);

            // Check if we need to continue to next page
            if (reviews.length >= posTarget || reviews.length >= reviewCountInfo.count) {
                console.log("Collected enough reviews, stopping.");
                break;
            }

            // Check if there's a next page
            const hasNextPage = await page.evaluate(() => {
                const nextPageElement = document.querySelector('ul.a-pagination li.a-last:not(.a-disabled)');
                return !!nextPageElement;
            });

            if (!hasNextPage) {
                console.log("No more pages with positive reviews.");
                break;
            }

            pageNumber++;

            // Add random delay between pages
            const randomDelay = TIME_BETWEEN_PAGES + Math.floor(Math.random() * 1000);
            await page.waitForTimeout(randomDelay);
        }

    } catch (error) {
        console.error(`Error while collecting reviews for ASIN ${asin}:`, error);
    }

    console.log(`Total positive reviews collected for ASIN ${asin}: ${reviews.length}`);
    return reviews.slice(0, posTarget);
}

async function extractReviews(page) {
    return page.evaluate(() => {
        const reviews = [];

        // Look for both div and li review elements
        const reviewElements = [...document.querySelectorAll('div[data-hook="review"]'),
            ...document.querySelectorAll('li[data-hook="review"]')];

        console.log(`Found ${reviewElements.length} review elements`);

        reviewElements.forEach((review, index) => {
            try {
                // Extract review ID
                const reviewId = review.id || `unknown-${index}`;

                // Extract title
                let title = null;
                const titleElement = review.querySelector('[data-hook="review-title"]');
                if (titleElement) {
                    // Find the span after the a-letter-space span
                    const spans = titleElement.querySelectorAll('span');
                    // The actual title is usually the last span in the element
                    if (spans.length > 0) {
                        const titleSpan = spans[spans.length - 1]; // Get the last span
                        title = titleSpan.textContent.trim();
                    } else {
                        // Fallback to the old method if no spans are found
                        title = titleElement.textContent.trim();
                        // Strip out the rating part if present
                        title = title.replace(/\d+(\.\d+)?\s*out of\s*\d+\s*stars/i, '').trim();
                    }
                }

                // Extract body
                let body = null;
                const bodyElement = review.querySelector('[data-hook="review-body"]');
                if (bodyElement) {
                    const bodyText = bodyElement.querySelector('span') || bodyElement;
                    body = bodyText ? bodyText.textContent.trim() : null;
                }

                // Extract rating
                let rating = null;
                const ratingElement = review.querySelector('[data-hook="review-star-rating"]');
                if (ratingElement) {
                    const ratingText = ratingElement.textContent.trim();
                    const match = ratingText.match(/(\d+(\.\d+)?)\s*out of\s*\d+/i);
                    rating = match ? parseFloat(match[1]) : null;
                }

                // Extract date and country
                let country = null;
                let date = null;
                const dateElement = review.querySelector('[data-hook="review-date"]');
                if (dateElement) {
                    const dateText = dateElement.textContent.trim();
                    const match = dateText.match(/Reviewed\s+in\s+(?:the\s+)?(.+?)\s+on\s+(.+)/i);
                    if (match) {
                        country = match[1];
                        date = match[2];
                    }
                }

                // Extract verified purchase
                const verifiedElement = review.querySelector('[data-hook="avp-badge"]');
                const verified = !!verifiedElement;

                // Extract helpful votes
                let helpfulVotes = 0;
                const voteElements = review.querySelectorAll('.a-size-base.a-color-tertiary.cr-vote-text');
                if (voteElements && voteElements.length > 0) {
                    for (const voteElement of voteElements) {
                        const voteText = voteElement.textContent.trim();
                        if (voteText.includes('found this helpful')) {
                            // Extract only the digits from the text
                            const digits = voteText.replace(/\D/g, '');
                            helpfulVotes = digits ? parseInt(digits, 10) : 0;
                            break;
                        }
                    }
                }

                reviews.push({
                    review_id: reviewId,
                    title: title,
                    body: body,
                    rating: rating,
                    country: country,
                    date: date,
                    verified_purchase: verified,
                    helpful_votes: helpfulVotes,
                    review_type: 'critical'
                });

            } catch (error) {
                console.log(`Error processing review: ${error.message}`);
            }
        });

        return reviews;
    });
}

module.exports = {
    getCriticalReviews,
    getPositiveReviews,
    extractReviews
};