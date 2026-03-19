import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ZapConfig, ScanProgress, Alert, ReportOptions } from '../types';

export class ZapClient {
  private client: AxiosInstance;
  private apiKey: string | null;

  constructor(config: ZapConfig) {
    this.apiKey = config.apiKey || null;
    const baseURL = `http://${config.host}:${config.port}`;

    this.client = axios.create({
      baseURL,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.apiKey) {
      this.client.interceptors.request.use((config) => {
        config.params = { ...config.params, apikey: this.apiKey };
        return config;
      });
    }
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error: any) {
      throw new Error(`ZAP API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async getVersion(): Promise<string> {
    const response = await this.request<{ version: string }>('/JSON/core/view/version');
    return response.version;
  }

  async spiderScan(url: string, maxDepth?: number, maxChildren?: number, recurse?: boolean): Promise<{ scan: string }> {
    const params: Record<string, any> = { url };
    if (maxDepth !== undefined) params.maxDepth = maxDepth;
    if (maxChildren !== undefined) params.maxChildren = maxChildren;
    if (recurse !== undefined) params.recurse = recurse;
    return this.request('/JSON/spider/action/scan', params);
  }

  async spiderStatus(scanId: string): Promise<ScanProgress> {
    return this.request('/JSON/spider/view/status', { scanId });
  }

  async spiderFullResults(scanId: string): Promise<any> {
    return this.request('/JSON/spider/view/fullResults', { scanId });
  }

  async ajaxSpiderScan(url: string, maxDuration?: number): Promise<{ scan: string }> {
    const params: Record<string, any> = { url };
    if (maxDuration !== undefined) params.maxDuration = maxDuration;
    return this.request('/JSON/ajaxSpider/action/scan', params);
  }

  async ajaxSpiderStatus(): Promise<{ status: string; nodesVisited: number }> {
    return this.request('/JSON/ajaxSpider/view/status');
  }

  async ajaxSpiderStop(): Promise<void> {
    await this.request('/JSON/ajaxSpider/action/stop', {});
  }

  async passiveScanEnable(): Promise<void> {
    await this.request('/JSON/pscan/action/setEnabled', { enabled: true });
  }

  async passiveScanDisable(): Promise<void> {
    await this.request('/JSON/pscan/action/setEnabled', { enabled: false });
  }

  async passiveScanRecordsToScan(): Promise<{ count: number }> {
    return this.request('/JSON/pscan/view/recordsToScan');
  }

  async activeScan(
    url: string,
    contextName?: string,
    userId?: number,
    policyName?: string
  ): Promise<{ scan: string }> {
    const params: Record<string, any> = { url };
    if (contextName) params.contextName = contextName;
    if (userId) params.userId = userId;
    if (policyName) params.policyName = policyName;
    return this.request('/JSON/ascan/action/scan', params);
  }

  async activeScanStatus(scanId?: string): Promise<ScanProgress | ScanProgress[]> {
    if (scanId) {
      return this.request('/JSON/ascan/view/scanProgress', { scanId });
    }
    return this.request('/JSON/ascan/view/scans');
  }

  async activeScanStop(scanId: string): Promise<void> {
    await this.request('/JSON/ascan/action/stop', { scanId });
  }

  async activeScanPause(scanId: string): Promise<void> {
    await this.request('/JSON/ascan/action/pause', { scanId });
  }

  async activeScanResume(scanId: string): Promise<void> {
    await this.request('/JSON/ascan/action/resume', { scanId });
  }

  async getAlerts(baseurl?: string, start?: number, count?: number): Promise<{ alerts: Alert[] }> {
    const params: Record<string, any> = {};
    if (baseurl) params.baseurl = baseurl;
    if (start !== undefined) params.start = start;
    if (count !== undefined) params.count = count;
    return this.request('/JSON/alert/view/alerts', params);
  }

  async getAlertsSummary(): Promise<any> {
    return this.request('/JSON/alert/view/alertsSummary');
  }

  async generateReport(options: ReportOptions): Promise<string> {
    const params: Record<string, any> = {
      title: options.title || 'ZAP Security Report',
      format: options.format,
    };
    if (options.template) params.template = options.template;
    if (options.description) params.description = options.description;
    if (options.contexts) params.contexts = options.contexts.join(',');
    if (options.sites) params.sites = options.sites.join(',');

    return this.request('/JSON/reports/action/generate', params);
  }

  async getJsonReport(): Promise<any> {
    return this.request('/OTHER/core/other/jsonreport');
  }

  async getXmlReport(): Promise<string> {
    const response = await this.client.get('/OTHER/core/other/xmlreport', {
      responseType: 'text',
    });
    return response.data;
  }

  async getHtmlReport(): Promise<string> {
    const response = await this.client.get('/OTHER/core/other/htmlreport', {
      responseType: 'text',
    });
    return response.data;
  }

  async getMdReport(): Promise<string> {
    const response = await this.client.get('/OTHER/core/other/mdreport', {
      responseType: 'text',
    });
    return response.data;
  }

  async setRuleConfigValue(key: string, value: string): Promise<void> {
    await this.request('/JSON/ruleConfig/action/setRuleConfigValue', { key, value });
  }

  async resetRuleConfigValue(key: string): Promise<void> {
    await this.request('/JSON/ruleConfig/action/resetRuleConfigValue', { key });
  }

  async resetAllRuleConfigValues(): Promise<void> {
    await this.request('/JSON/ruleConfig/action/resetAllRuleConfigValues', {});
  }

  async getAllRuleConfigs(): Promise<any> {
    return this.request('/JSON/ruleConfig/view/allRuleConfigs');
  }

  async getLogLevel(): Promise<{ level: string }> {
    return this.request('/JSON/core/view/getLogLevel');
  }

  async setLogLevel(level: string): Promise<void> {
    await this.request('/JSON/core/action/setLogLevel', { level });
  }

  async accessUrl(url: string): Promise<void> {
    await this.request('/JSON/core/action/accessUrl', { url });
  }

  async shutdown(): Promise<void> {
    await this.request('/JSON/core/action/shutdown', {});
  }

  async newSession(name?: string, overwrite?: boolean): Promise<void> {
    const params: Record<string, any> = {};
    if (name) params.name = name;
    if (overwrite !== undefined) params.overwrite = overwrite;
    await this.request('/JSON/core/action/newSession', params);
  }

  async saveSession(name: string, overwrite?: boolean): Promise<void> {
    const params: Record<string, any> = { name };
    if (overwrite !== undefined) params.overwrite = overwrite;
    await this.request('/JSON/core/action/saveSession', params);
  }

  async getSites(): Promise<{ sites: string[] }> {
    return this.request('/JSON/core/view/sites');
  }

  async getUrls(): Promise<{ urls: string[] }> {
    return this.request('/JSON/core/view/urls');
  }

  async enableAllScanners(policyName?: string): Promise<void> {
    const params: Record<string, any> = {};
    if (policyName) params.policyName = policyName;
    await this.request('/JSON/ascan/action/enableAllScanners', params);
  }

  async disableAllScanners(policyName?: string): Promise<void> {
    const params: Record<string, any> = {};
    if (policyName) params.policyName = policyName;
    await this.request('/JSON/ascan/action/disableAllScanners', params);
  }

  async enableScanners(ids: number[], policyName?: string): Promise<void> {
    const params: Record<string, any> = { ids: ids.join(',') };
    if (policyName) params.policyName = policyName;
    await this.request('/JSON/ascan/action/enableScanners', params);
  }

  async disableScanners(ids: number[], policyName?: string): Promise<void> {
    const params: Record<string, any> = { ids: ids.join(',') };
    if (policyName) params.policyName = policyName;
    await this.request('/JSON/ascan/action/disableScanners', params);
  }

  async setScannerAlertThreshold(scannerId: number, threshold: string, policyName?: string): Promise<void> {
    const params: Record<string, any> = { scannerId, alertThreshold: threshold };
    if (policyName) params.policyName = policyName;
    await this.request('/JSON/ascan/action/setScannerAlertThreshold', params);
  }

  async setScannerAttackStrength(scannerId: number, strength: string, policyName?: string): Promise<void> {
    const params: Record<string, any> = { scannerId, attackStrength: strength };
    if (policyName) params.policyName = policyName;
    await this.request('/JSON/ascan/action/setScannerAttackStrength', params);
  }
}
