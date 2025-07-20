const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });


  // Generate a slightly randomized user-agent and viewport
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const chromeVersion = getRandomInt(118, 124);
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
  const viewport = {
    width: getRandomInt(1200, 1400),
    height: getRandomInt(700, 900)
  };
  const context = await browser.newContext({
    userAgent,
    viewport,
    locale: 'en-US',
  });
  const page = await context.newPage();

  // Go to Amazon homepage and let user click 'Sign In' manually
  await page.goto('https://www.amazon.com/');

  // Simulate some human-like mouse movement and scrolling
  await page.mouse.move(getRandomInt(100, 800), getRandomInt(100, 500));
  await page.waitForTimeout(getRandomInt(500, 1500));
  await page.mouse.move(getRandomInt(200, 1000), getRandomInt(200, 600));
  await page.waitForTimeout(getRandomInt(500, 1500));
  await page.mouse.move(getRandomInt(300, 1200), getRandomInt(300, 700));
  await page.waitForTimeout(getRandomInt(500, 1500));
  await page.mouse.wheel(0, getRandomInt(100, 400));
  await page.waitForTimeout(getRandomInt(500, 1500));

  console.log('\n🔑 Please log into your Amazon account manually in the opened browser...');
  console.log('⚠️ DO NOT close the terminal until you are logged in.\n');

  // Wait for user confirmation before saving cookies
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('When you are fully logged in to Amazon in the browser, press Enter here to save cookies...\n', async () => {
    console.log('✅ Saving cookies...');
    const cookies = await context.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    console.log('🍪 Cookies saved to cookies.json');
    await browser.close();
    rl.close();
  });
})();
