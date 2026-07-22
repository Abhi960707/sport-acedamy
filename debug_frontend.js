const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`BROWSER PAGE ERROR: ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  
  // Wait a bit to let things load
  await page.waitForTimeout(5000);
  
  console.log('Done waiting on /');
  
  // Also try going to /home
  console.log('Navigating to http://localhost:3000/home...');
  await page.goto('http://localhost:3000/home');
  await page.waitForTimeout(5000);

  await browser.close();
})();
