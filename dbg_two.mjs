import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './scripts/browser_path.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: BROWSER_PATH, headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], defaultViewport: { width: 2000, height: 1150 } });
const page = await browser.newPage();
await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded' });
await sleep(900);
await page.evaluate(() => document.querySelector('#btn-online')?.click());
await sleep(500);
await page.evaluate(() => {
  const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  set('#login-user', 'uishot_szl2s7'); set('#login-pass', 'hunter22');
  document.querySelector('#btn-login').click();
});
const deadline = Date.now() + 25000;
for (;;) {
  const s = await page.evaluate(() => {
    const vis = (sel) => { const el = document.querySelector(sel); return !!el && !el.hidden && getComputedStyle(el).display !== 'none'; };
    if (vis('#charselect-panel')) return 'chars';
    const row = document.querySelector('#realm-list .realm-row');
    if (row && vis('#realm-panel')) { row.click(); return 'clicked'; }
    return 'waiting';
  });
  if (s === 'chars') break;
  if (Date.now() > deadline) throw new Error('stuck: ' + s);
  await sleep(400);
}
await sleep(1500);
await page.evaluate(() => {
  // Preview the linked-GitHub state: card visible with status pill + unlink.
  const g = document.querySelector('#cs-github-group');
  g.hidden = false;
  const st = document.querySelector('#github-status');
  st.hidden = false;
  st.textContent = '@Rubsey - Worldwright';
  document.querySelector('#btn-github-unlink').hidden = false;
});
await sleep(400);
await page.screenshot({ path: '/tmp/charselect_twocards.png' });
await browser.close();
