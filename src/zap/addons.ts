import { ZapBase } from './zapBase';

export interface RunCrawlAndScanResult {
  result: string;
}

export interface ScreenshotPageResult {
  result: string;
}

export class PlaywrightClientAPI extends ZapBase {
  async runCrawlAndScan(url: string): Promise<RunCrawlAndScanResult> {
    return this.request<RunCrawlAndScanResult>('/JSON/playwrightclient/action/runCrawlAndScan', { url });
  }

  async screenshotPage(url: string): Promise<ScreenshotPageResult> {
    return this.request<ScreenshotPageResult>('/JSON/playwrightclient/action/screenshotPage', { url });
  }

  async downloadScreenshot(file?: string): Promise<Buffer> {
    let endpoint = '/OTHER/playwrightclient/other/screenshot';
    const params: Record<string, string> = {};
    if (file) params.file = file;
    const response = await this.client.get(endpoint, {
      params: { ...params, ...(this.apiKey ? { apikey: this.apiKey } : {}) },
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }
}
