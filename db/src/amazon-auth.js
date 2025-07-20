const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");

// Path for storing cookies (use cookies.json created by saveCookies.js)
const COOKIES_FILE = path.join(__dirname, "../cookies.json");

/**
 * Gets an authenticated Playwright browser instance
 * @param {Object} options - Browser options like headless mode
 * @returns {Promise<Object>} Object with browser, page and other utilities
 */
async function get_driver(options = {}) {
  // Default options - change default to headless: false
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const chromeVersion = getRandomInt(118, 124);
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
  const viewport = {
    width: getRandomInt(1200, 1400),
    height: getRandomInt(700, 900)
  };
  const browserOptions = {
    headless: false,
    ...options,
  };
  console.log("Launching Playwright browser...");
  const browser = await chromium.launch(browserOptions);
  const context = await browser.newContext({
    userAgent,
    viewport,
    locale: 'en-US',
  });

  try {
    // Check if cookies file exists and load if it does
    try {
      const cookiesString = await fs.readFile(COOKIES_FILE, "utf8");
      const cookies = JSON.parse(cookiesString);
      await context.addCookies(cookies);
      console.log(`Loaded ${cookies.length} cookies from cookies.json`);
    } catch (error) {
      console.error("No saved cookies found in cookies.json or error loading cookies:", error.message);
      // Continue without cookies - will require manual login
    }

    // Create page
    const page = await context.newPage();

    // Simulate some human-like mouse movement and scrolling before navigation
    await page.mouse.move(getRandomInt(100, 800), getRandomInt(100, 500));
    await page.waitForTimeout(getRandomInt(500, 1500));
    await page.mouse.move(getRandomInt(200, 1000), getRandomInt(200, 600));
    await page.waitForTimeout(getRandomInt(500, 1500));
    await page.mouse.move(getRandomInt(300, 1200), getRandomInt(300, 700));
    await page.waitForTimeout(getRandomInt(500, 1500));
    await page.mouse.wheel(0, getRandomInt(100, 400));
    await page.waitForTimeout(getRandomInt(500, 1500));

    // Helper: human-like delay
    const humanDelay = async (min = 500, max = 2000) => {
      await page.waitForTimeout(getRandomInt(min, max));
    };
    // Helper: screenshot on failure
    const screenshotOnFailure = async (action, filename) => {
      try {
        return await action();
      } catch (err) {
        await page.screenshot({ path: filename || `debug-failure-${Date.now()}.png` });
        console.error(`Saved screenshot of failure to ${filename}`);
        throw err;
      }
    };

    // Add helper method to save cookies
    const save_cookies = async () => {
      const cookies = await context.cookies();
      await fs.writeFile(COOKIES_FILE, JSON.stringify(cookies, null, 2));
      console.log(`Saved ${cookies.length} cookies to file`);
      return cookies.length;
    };

    // Add helper method to check login status
    const is_logged_in = async () => {
      return page.evaluate(() => {
        return (
          document.body.textContent.includes("Hello,") ||
          document
            .querySelector("#nav-link-accountList-nav-line-1")
            ?.textContent.includes("Hello,")
        );
      });
    };

    return {
      browser,
      context,
      page,
      save_cookies,
      is_logged_in,
      humanDelay,
      screenshotOnFailure,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

module.exports = {
  get_driver,
};
