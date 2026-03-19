export interface ZapConfig {
  host: string;
  port: number;
  apiKey?: string;
}

export interface ScanOptions {
  url: string;
  maxDepth?: number;
  maxChildren?: number;
  recurse?: boolean;
  contextName?: string;
  userId?: number;
}

export interface ActiveScanOptions extends ScanOptions {
  policyName?: string;
  method?: string;
  postData?: string;
}

export interface AjaxScanOptions {
  url: string;
  maxDuration?: number;
  maxCrawlDepth?: number;
  maxCrawlStates?: number;
  browserId?: string;
}

export interface ReportOptions {
  format: 'xml' | 'json' | 'md' | 'html';
  title?: string;
  template?: string;
  description?: string;
  contexts?: string[];
  sites?: string[];
}

export interface Alert {
  id: number;
  pluginid: string;
  alert: string;
  risk: string;
  confidence: string;
  url: string;
  method: string;
  param: string;
  attack: string;
  evidence: string;
  other: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid: string;
  sourceId: string;
}

export interface ScanProgress {
  id: number;
  progress: number;
  state: string;
}

export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  pat: string;
}

export interface WorkItem {
  title: string;
  description: string;
  type: 'Bug' | 'Task' | 'User Story';
  severity?: string;
  priority?: number;
}

export interface JUnitResult {
  testSuite: string;
  testCases: JUnitTestCase[];
  failures: number;
  errors: number;
  skipped: number;
  time: number;
}

export interface JUnitTestCase {
  name: string;
  classname: string;
  time: number;
  failure?: {
    message: string;
    type: string;
  };
  error?: {
    message: string;
    type: string;
  };
  skipped?: boolean;
}
