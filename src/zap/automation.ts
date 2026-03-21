import { ZapBase } from './zapBase';

export class AutomationAPI extends ZapBase {
  async runPlan(planPath: string): Promise<string> {
    const result = await this.request<{ planId: string }>('/JSON/automation/action/runPlan/', { filePath: planPath });
    return result.planId;
  }

  async planProgress(planId: string): Promise<{ jobManager: string; jobThreads: any[] }> {
    return this.request('/JSON/automation/view/planProgress/', { planId });
  }

  async endDelayJob(): Promise<void> {
    await this.request('/JSON/automation/action/endDelayJob', {});
  }
}
