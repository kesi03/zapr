import yargs from 'yargs';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';
import { createProgressBar, startProgress, updateProgress, stopProgress } from '../utils/progress';

interface ScanArgs {
  url: string;
  passive?: boolean;
  spider?: boolean;
  ajax?: boolean;
  active?: boolean;
  maxDepth?: number;
  maxChildren?: number;
  recurse?: boolean;
  ajaxMaxDuration?: number;
  context?: string;
  userId?: number;
  policy?: string;
  pollInterval?: number;
  timeout?: number;
  host?: string;
  port?: number;
  apiKey?: string;
  debug?: boolean;
}

export const scanCommand: yargs.CommandModule = {
  command: 'scan',
  describe: 'Run a comprehensive security scan (passive, spider, ajax, active)',
  builder: (yargs) => {
    return yargs
      .option('url', {
        alias: 'u',
        type: 'string',
        demandOption: true,
        description: 'URL to scan',
      })
      .option('passive', {
        type: 'boolean',
        default: true,
        description: 'Enable passive scanning',
      })
      .option('spider', {
        type: 'boolean',
        default: true,
        description: 'Enable spider scanning',
      })
      .option('ajax', {
        type: 'boolean',
        default: true,
        description: 'Enable AJAX spider scanning',
      })
      .option('active', {
        type: 'boolean',
        default: true,
        description: 'Enable active scanning',
      })
      .option('max-depth', {
        type: 'number',
        description: 'Maximum depth the spider can crawl (0 for unlimited)',
      })
      .option('max-children', {
        type: 'number',
        description: 'Limit the number of children scanned (0 for unlimited)',
      })
      .option('recurse', {
        type: 'boolean',
        default: true,
        description: 'Enable recursion into found URLs',
      })
      .option('ajax-max-duration', {
        type: 'number',
        default: 5,
        description: 'Maximum duration for AJAX spider in minutes',
      })
      .option('context', {
        alias: 'c',
        type: 'string',
        description: 'Context name for authenticated scanning',
      })
      .option('user-id', {
        type: 'number',
        description: 'User ID for authenticated scanning',
      })
      .option('policy', {
        type: 'string',
        description: 'Scan policy name',
      })
      .option('poll-interval', {
        type: 'number',
        description: 'Polling interval in ms to check scan status',
      })
      .option('timeout', {
        type: 'number',
        description: 'Maximum time to wait for each scan in ms',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const args = argv as unknown as ScanArgs;
    
    const zap = new ZapClient({
      host: args.host,
      port: args.port,
      apiKey: args.apiKey,
    });

    log.info(`Starting comprehensive security scan on: ${args.url}`);
    log.info(`ZAP Host: ${args.host}:${args.port}`);
    log.info(`Scan types: passive=${args.passive}, spider=${args.spider}, ajax=${args.ajax}, active=${args.active}`);

    try {
      const version = await zap.core.getVersion();
      log.info(`Connected to ZAP version: ${version}`);

      if (args.passive) {
        log.info('Enabling passive scanning...');
        await zap.pscan.enableAllScanners();
        await zap.pscan.setScanPolicy('Default');
        log.success('Passive scanning enabled');
      }

      if (args.spider) {
        log.info('Starting spider scan...');
        const spiderProgress = createProgressBar('Spider Scan |{bar}| {percentage}% | State: {state}');
        
        const spiderId = await zap.spider.spiderScan(
          args.url,
          args.maxDepth,
          args.maxChildren,
          args.recurse
        );
        log.info(`Spider scan started with ID: ${spiderId}`);

        const spiderStartTime = Date.now();
        let spiderStatus = await zap.spider.spiderStatus(spiderId);

        startProgress(spiderProgress, 100, { state: spiderStatus.state || 'RUNNING' });

        while (
          spiderStatus.state !== 'FINISHED' &&
          spiderStatus.state !== 'STOPPED' &&
          Date.now() - spiderStartTime < ((args.timeout as number) || 300000)
        ) {
          updateProgress(spiderProgress, spiderStatus.progress, { state: spiderStatus.state || 'RUNNING' });
          await new Promise((resolve) => setTimeout(resolve, (args.pollInterval as number) || 2000));
          spiderStatus = await zap.spider.spiderStatus(spiderId);
        }

        updateProgress(spiderProgress, 100, { state: spiderStatus.state || 'FINISHED' });
        stopProgress(spiderProgress);

        if (spiderStatus.state === 'FINISHED') {
          log.success('Spider scan completed!');
          const fullResults = await zap.spider.spiderFullResults(spiderId);
          log.info(`Found ${fullResults.results?.length || 0} URLs`);
        } else {
          log.warn(`Spider scan ended with status: ${spiderStatus.state}`);
        }
      }

      if (args.ajax) {
        log.info('Starting AJAX spider scan...');
        const ajaxProgress = createProgressBar('AJAX Spider |{bar}| {percentage}% | State: {state}');

        const ajaxId = await zap.spider.ajaxSpiderScan(args.url, true);
        log.info(`AJAX spider scan started`);

        let ajaxStatus = await zap.spider.ajaxSpiderStatus();
        const ajaxStartTime = Date.now();

        startProgress(ajaxProgress, 100, { state: ajaxStatus.running ? 'RUNNING' : 'STOPPED' });

        while (ajaxStatus.running && Date.now() - ajaxStartTime < ((args.timeout as number) || 300000)) {
          updateProgress(ajaxProgress, 0, { state: 'RUNNING' });
          await new Promise((resolve) => setTimeout(resolve, (args.pollInterval as number) || 5000));
          ajaxStatus = await zap.spider.ajaxSpiderStatus();
        }

        updateProgress(ajaxProgress, 100, { state: ajaxStatus.running ? 'RUNNING' : 'FINISHED' });
        stopProgress(ajaxProgress);

        const ajaxResults = await zap.spider.ajaxSpiderResults();
        log.success(`AJAX spider scan completed! Found ${ajaxResults.results?.length || 0} URLs`);
      }

      if (args.active) {
        log.info('Starting active scan...');
        
        try {
          await zap.core.accessUrl(args.url);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          log.warn('Could not add URL to scan tree, attempting scan anyway...');
        }

        const activeProgress = createProgressBar('Active Scan |{bar}| {percentage}% | Status: {state}');

        const activeScanId = await zap.ascan.activeScan(
          args.url,
          args.context,
          args.userId,
          args.policy
        );
        log.info(`Active scan started with ID: ${activeScanId}`);

        const activeStartTime = Date.now();
        let scan = await zap.ascan.activeScanStatus(activeScanId) as any;

        startProgress(activeProgress, 100, { state: scan.state || 'RUNNING' });

        while (
          scan.state !== 'FINISHED' &&
          scan.state !== 'STOPPED' &&
          scan.state !== 'PAUSED' &&
          Date.now() - activeStartTime < ((args.timeout as number) || 600000)
        ) {
          updateProgress(activeProgress, scan.progress || 0, { state: scan.state || 'RUNNING' });
          await new Promise((resolve) => setTimeout(resolve, (args.pollInterval as number) || 5000));
          scan = await zap.ascan.activeScanStatus(activeScanId) as any;
        }

        updateProgress(activeProgress, 100, { state: scan.state || 'FINISHED' });
        stopProgress(activeProgress);

        log.success('Active scan completed!');

        const alerts = await zap.alerts.getAlerts(args.url);
        log.info(`Found ${alerts.alerts.length} alerts`);

        const summary = await zap.alerts.getAlertsSummary();
        const riskConf = summary.RiskConf || summary || {};
        log.info('Alert Summary:');
        log.info(`  High: ${riskConf.High || 0}`);
        log.info(`  Medium: ${riskConf.Medium || 0}`);
        log.info(`  Low: ${riskConf.Low || 0}`);
        log.info(`  Informational: ${riskConf.Informational || 0}`);
      }

      log.success('Comprehensive security scan completed!');
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};