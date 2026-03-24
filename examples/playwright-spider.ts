import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { URL } from 'url';

type Result = {
  url: string;
  title?: string | null;
  description?: string | null;
  links: string[];
};

async function crawlPage(url: string, waitForSelector = 'body'): Promise<Result> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);

    const result = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter((h): h is string => !!h);

      const titleEl = document.querySelector('title')?.textContent || null;
      const desc = document.querySelector('meta[name=\"description\"]')?.getAttribute('content') || null;

      return {
        title: titleEl,
        description: desc,
        links: anchors
      };
    });

    await browser.close();

    return {
      url,
      title: result.title,
      description: result.description,
      links: result.links
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// New: run crawler and write JSON file of absolute URLs
(async () => {
  const startUrl = process.argv[2] || 'http://localhost:3000';
  const waitForSelector = process.argv[3] || 'div#root';
  const outPath = process.argv[4] || 'links.json';

  try {
    const res = await crawlPage(startUrl, waitForSelector);

    // Resolve relative hrefs to absolute URLs and filter out non-http(s) schemes
    const resolved = Array.from(new Set(
      res.links
        .map(href => {
          try {
            return new URL(href, res.url).toString();
          } catch {
            return null;
          }
        })
        .filter((u): u is string => !!u)
        .filter(u => u.startsWith('http://') || u.startsWith('https://'))
    ));

    const out = {
      crawledFrom: res.url,
      title: res.title,
      description: res.description,
      urls: resolved
    };

    writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
    console.log(`Wrote ${resolved.length} URLs to ${outPath}`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
