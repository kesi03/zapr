import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AzureDevOpsConfig, WorkItem, Alert } from '../types';

export class AzureDevOpsService {
  private client: AxiosInstance;
  private project: string;

  constructor(config: AzureDevOpsConfig) {
    this.project = config.project;
    const token = Buffer.from(`:${config.pat}`).toString('base64');

    this.client = axios.create({
      baseURL: `https://dev.azure.com/${config.organization}/${config.project}`,
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        url: `/_apis/${endpoint}`,
        method,
        data,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Azure DevOps API Error: ${error.response?.status} - ${message}`);
    }
  }

  async createWorkItem(workItem: WorkItem, areaPath?: string, iterationPath?: string): Promise<{ id: number; url: string }> {
    const workItemType = workItem.type;
    const fields: Record<string, any> = {
      'System.Title': workItem.title,
      'System.Description': workItem.description,
      'System.WorkItemType': workItemType,
    };

    if (workItem.severity) {
      fields['Microsoft.VSTS.Common.Severity'] = workItem.severity;
    }

    if (workItem.priority !== undefined) {
      fields['Microsoft.VSTS.Common.Priority'] = workItem.priority;
    }

    if (areaPath) {
      fields['System.AreaPath'] = areaPath;
    }

    if (iterationPath) {
      fields['System.IterationPath'] = iterationPath;
    }

    const operations = Object.entries(fields).map(([rel, value]) => ({
      op: 'add',
      path: `/fields/${rel}`,
      value: value,
    }));

    return this.request<{ id: number; url: string }>(
      `wit/workitems/$${encodeURIComponent(workItemType)}?api-version=7.0`,
      'POST',
      operations
    );
  }

  async createBugFromAlert(alert: Alert, severity: string = '2', priority: number = 2): Promise<{ id: number; url: string }> {
    const bug: WorkItem = {
      title: `[Security] ${alert.alert} - ${alert.url}`,
      description: this.formatAlertAsBugDescription(alert),
      type: 'Bug',
      severity,
      priority,
    };

    return this.createWorkItem(bug);
  }

  private formatAlertAsBugDescription(alert: Alert): string {
    return `
## Security Alert Details

**Plugin ID:** ${alert.pluginid}
**Risk Level:** ${alert.risk}
**Confidence:** ${alert.confidence}
**URL:** ${alert.url}
**Method:** ${alert.method}
**Parameter:** ${alert.param}
**Attack:** ${alert.attack || 'N/A'}
**Evidence:** ${alert.evidence || 'N/A'}

## Solution
${alert.solution || 'No solution provided'}

## Reference
${alert.reference || 'No reference provided'}

## CWE ID: ${alert.cweid || 'N/A'}
## WASC ID: ${alert.wascid || 'N/A'}
    `.trim();
  }

  async createTestResult(
    testRunName: string,
    testResults: Array<{ name: string; passed: boolean; errorMessage?: string; duration?: number }>,
    buildId?: number,
    releaseId?: number
  ): Promise<{ id: number; url: string }> {
    const testRun = await this.request<{ id: number; url: string }>(
      'test/runs?api-version=7.0',
      'POST',
      {
        name: testRunName,
        automated: true,
        build: buildId ? { id: buildId } : undefined,
        release: releaseId ? { id: releaseId } : undefined,
      }
    );

    const testCaseResults = testResults.map((result) => ({
      testCase: { name: result.name },
      outcome: result.passed ? 'Passed' : 'Failed',
      errorMessage: result.errorMessage,
      durationInMs: result.duration,
    }));

    await this.request(
      `test/runs/${testRun.id}/results?api-version=7.0`,
      'POST',
      testCaseResults
    );

    return testRun;
  }

  async getWorkItem(id: number): Promise<any> {
    return this.request(`wit/workitems/${id}?api-version=7.0`);
  }

  async updateWorkItem(id: number, updates: Record<string, any>): Promise<any> {
    const operations = Object.entries(updates).map(([field, value]) => ({
      op: 'replace',
      path: `/fields/${field}`,
      value: value,
    }));

    return this.request(`wit/workitems/${id}?api-version=7.0`, 'PATCH', operations);
  }
}
