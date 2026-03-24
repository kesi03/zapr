#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { chromium, Browser } from 'playwright';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

type PageEntry = {
  url: string;
  title?: string;
  status?: number;
  screenshot?: string; // relative path
  links?: string[];    // discovered links (same-origin)
};

const argv = yargs(hideBin(process.argv))
  .option('baseUrl', { type: 'string', demandOption: true, describe: 'Base URL to crawl (scheme://host[:port])' })
  .option('out', { type: 'string', default: 'output', describe: 'Output directory' })
  .option('concurrency', { type: 'number', default: 3, describe: 'Parallel page visits' })
  .option('maxPages', { type: 'number', default: 200, describe: 'Max pages to crawl' })
  .option('headless', { type: 'boolean', default: true, describe: 'Run browser headless' })
  .argv as any;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(s: string) {
  return s.replace(/[:/?#\\<>|*"']/g, '_').slice(0, 200);
}

(async () => {
  const baseUrl: string = argv.baseUrl.replace(/\/+$/, '');
  const outDir = path.resolve(process.cwd(), argv.out);
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'screenshots'));

  const browser: Browser = await chromium.launch({ headless: argv.headless });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Capture front page screenshot
  const frontScreenshotName = `front_${sanitizeFilename(new URL(baseUrl).hostname)}.png`;
  const frontScreenshotPath = path.join('screenshots', frontScreenshotName);
  try {
    const r = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const status = r?.status();
    await page.screenshot({ path: path.join(outDir, frontScreenshotPath), fullPage: true });
    console.log('Front page captured:', baseUrl);
  } catch (e) {
    console.error('Failed to capture front page:', e.message || e);
  }

  // Crawl: BFS same-origin, collect URLs
  const visited = new Set<string>();
  const queue: string[] = [baseUrl];
  const results: PageEntry[] = [];
  const maxPages: number = argv.maxPages;
  const concurrency: number = Math.max(1, Math.floor(argv.concurrency));
  const origin = new URL(baseUrl).origin;

  // Worker to process a single URL
  async function processUrl(u: string): Promise<PageEntry> {
    const entry: PageEntry = { url: u, links: [] };
    const p = await context.newPage();
    try {
      const resp = await p.goto(u, { waitUntil: 'networkidle', timeout: 30000 });
      entry.status = resp?.status();
      try { entry.title = (await p.title()) || undefined; } catch {}
      // screenshot
      const name = `${sanitizeFilename(new URL(u).pathname || 'root')}_${sanitizeFilename(new URL(u).search || '')}_${Date.now()}.png`;
      const rel = path.join('screenshots', name);
      await p.screenshot({ path: path.join(outDir, rel), fullPage: true });
      entry.screenshot = rel;

      // extract same-origin links (absolute)
      const anchors = await p.$$eval('a[href]', as => as.map(a => (a as HTMLAnchorElement).href));
      for (const href of anchors) {
        try {
          const nu = new URL(href, u).toString();
          if (nu.startsWith(origin)) {
            entry.links!.push(nu.split('#')[0]);
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error loading', u, err?.message || err);
    } finally {
      await p.close();
    }
    return entry;
  }

  // Parallel BFS loop
  while (queue.length > 0 && results.length < maxPages) {
    const batch = queue.splice(0, concurrency);
    const proms = batch.map(async (u) => {
      if (visited.has(u) || results.length >= maxPages) return null;
      visited.add(u);
      const e = await processUrl(u);
      results.push(e);
      // enqueue discovered links
      for (const l of e.links || []) {
        const clean = l.split('#')[0];
        if (!visited.has(clean) && !queue.includes(clean) && results.length + queue.length < maxPages) {
          queue.push(clean);
        }
      }
      return e;
    });
    await Promise.all(proms);
  }

  // create sitemap JSON file
  const sitemap = {
    baseUrl: baseUrl,
    generatedAt: new Date().toISOString(),
    pages: results
  };
  const sitemapPath = path.join(outDir, 'sitemap.json');
  fs.writeFileSync(sitemapPath, JSON.stringify(sitemap, null, 2), 'utf8');

  console.log('Done. Pages:', results.length);
  console.log('Sitemap:', sitemapPath);
  await browser.close();
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
