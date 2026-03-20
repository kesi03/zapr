import { ZapBase } from './zapBase';
import { ScanProgress } from '../types';

export class SpiderAPI extends ZapBase {
  async spiderScan(url: string, maxDepth?: number, maxChildren?: number, recurse?: boolean) {
    const params: Record<string, any> = { url };
    if (maxDepth !== undefined) params.maxDepth = maxDepth;
    if (maxChildren !== undefined) params.maxChildren = maxChildren;
    if (recurse !== undefined) params.recurse = recurse;
    const response = await this.request<{ scan: string }>('/JSON/spider/action/scan', params);
    return response.scan;
  }

  async spiderStatus(scanId: string): Promise<{ progress: number; state: string }> {
    const response = await this.request<{ status: { progress: number; state: string } }>('/JSON/spider/view/status', { scanId });
    return response.status;
  }

  async spiderFullResults(scanId: string): Promise<any> {
    const response = await this.request<{ results: any[] }>('/JSON/spider/view/fullResults', { scanId });
    return response;
  }
}

export class AjaxSpiderAPI extends ZapBase {
  async ajaxSpiderScan(url: string, maxDuration?: number) {
    const params: Record<string, any> = { url };
    if (maxDuration !== undefined) params.maxDuration = maxDuration;
    const response = await this.request<{ scan: string }>('/JSON/ajaxSpider/action/scan', params);
    return response.scan;
  }

  async ajaxSpiderStatus(): Promise<{ status: string; nodesVisited: number }> {
    const response = await this.request<{ status: { status: string; nodesVisited: number } }>('/JSON/ajaxSpider/view/status');
    return response.status;
  }

  async ajaxSpiderStop(): Promise<void> {
    await this.request('/JSON/ajaxSpider/action/stop');
  }
}
