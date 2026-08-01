import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN || '/snap/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => {
  window.phantom = {
    solana: {
      connect: async () => ({ publicKey: { toString: () => '7XFKTESTWALLET3MPQ' } }),
    },
  };
});

const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));
const check = (value, message) => {
  if (!value) throw new Error(message);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4178/?skip=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  check(await page.$eval('h1', (el) => el.textContent.includes('EVERY SIGNAL')), 'Cinematic home failed');

  await page.click('a[href="/launch"]');
  await page.waitForSelector('#launchForm');
  await page.click('[data-mode="ai"]');
  await page.type('#aiPrompt', 'a sentient solana puddle');
  await page.click('[data-action="generate"]');
  check(await page.$eval('#aiResult h3', (el) => el.textContent.includes('SENTIENT SOLANA')), 'AI identity failed');

  await page.click('#aiResult [data-mode="manual"]');
  check(await page.$eval('#tokenName', (el) => el.value) === 'SENTIENT SOLANA', 'AI draft transfer failed');
  await page.$eval('#tokenName', (el) => { el.value = 'OPERABLE SLOP'; });
  await page.$eval('#tokenTicker', (el) => { el.value = 'OPS'; });
  await page.click('#launchForm input[type="checkbox"]');
  await page.click('#launchForm button[type="submit"]');
  await sleep(800);
  check(await page.$eval('.token-title h1', (el) => el.textContent) === 'OPERABLE SLOP', 'Created token route failed');
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('solslop-tokens'))[0]?.sym === 'OPS'), 'Launch persistence failed');

  await page.click('[data-action="connect"]');
  await page.click('[data-wallet="Phantom"]');
  await sleep(200);
  check(await page.$eval('[data-action="connect"]', (el) => el.textContent.includes('7XFK')), 'Wallet connection failed');

  await page.click('[data-amount="0.5"]');
  check(await page.$eval('#tradeQuote b', (el) => el.textContent.includes('OPS')), 'Trade quote failed');
  await page.click('[data-action="trade"]');
  check(await page.$eval('#toast', (el) => el.textContent.includes('ORDER PREVIEW')), 'Trade preview failed');

  await page.click('a[href="/leaderboard"]');
  await page.waitForSelector('#search');
  await page.click('[data-sort="new"]');
  await page.waitForSelector('[data-sort="new"].active', { timeout: 5000 });
  check(await page.$eval('[data-sort="new"]', (el) => el.classList.contains('active')), 'Leaderboard sort failed');
  await page.type('#search', 'VOID');
  check(await page.$$eval('#leaderList .leader-row', (els) => els.length) === 1, 'Leaderboard search failed');

  await page.click('a[href="/rewards"]');
  await page.waitForSelector('[data-action="tap"]');
  const before = +(await page.$eval('[data-action="tap"]', (el) => el.textContent));
  await page.click('[data-action="tap"]');
  check(+(await page.$eval('[data-action="tap"]', (el) => el.textContent)) === before + 1, 'Reward tap failed');

  check(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify({
    status: 'PASS',
    workflows: ['navigation', 'AI builder', 'draft transfer', 'launch persistence', 'wallet connect', 'trade quote', 'trade preview', 'leaderboard sort', 'search', 'rewards tap'],
    errors,
  }));
} finally {
  await browser.close();
}
