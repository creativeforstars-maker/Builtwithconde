// Captures screenshots of each view of the real GrowthStack OS panel
// (panel-source/index.html) to use as authentic b-roll inside the reels.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const panelPath = path.join(__dirname, '..', 'panel-source', 'index.html');
const outDir = path.join(__dirname, '..', 'assets', 'screenshots');

const views = ['dashboard', 'identity', 'pipeline', 'outbound', 'sales', 'content', 'metrics', 'sops'];

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('file://' + panelPath);
  await page.waitForTimeout(400);

  for (const v of views) {
    await page.evaluate((view) => { window.nav(view); }, v);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(outDir, `${v}.png`) });
    console.log('captured', v);
  }

  await browser.close();
};

run();
