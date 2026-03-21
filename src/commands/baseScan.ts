import yargs from 'yargs';
import cliProgress from 'cli-progress';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';

export const baseScanCommand: yargs.CommandModule = {
  command: 'baseScan',
  describe: 'Run a spider scan to discover URLs on the target site',
  builder: (yargs) => {
    return yargs
      .option('url', {
        alias: 'u',
        type: 'string',
        demandOption: true,
        description: 'URL to scan',
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
      .option('poll-interval', {
        type: 'number',
        default: 2000,
        description: 'Polling interval in ms to check scan status',
      })
      .option('timeout', {
        type: 'number',
        default: 300000,
        description: 'Maximum time to wait for scan to complete in ms',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    log.info(`Starting spider scan on: ${argv.url}`);
    log.info(`Host: ${argv.host}:${argv.port}`);
    log.info(`Max Depth: ${argv.maxDepth || 'unlimited'}`);
    log.info(`Max Children: ${argv.maxChildren || 'unlimited'}`);
    log.info(`Recurse: ${argv.recurse}`);

    try {
      const version = await zap.core.getVersion();
      log.info(`Connected to ZAP version: ${version}`);

      const scanId = await zap.spider.spiderScan(
        argv.url as string,
        argv.maxDepth as number | undefined,
        argv.maxChildren as number | undefined,
        argv.recurse as boolean | undefined
      );

      log.info(`Scan started with ID: ${scanId}`);

      const progressBar = new cliProgress.SingleBar({
        format: 'Spider Scan |{bar}| {percentage}% | State: {state}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      });

      const startTime = Date.now();
      let status = await zap.spider.spiderStatus(scanId);

      progressBar.start(100, 0, { state: status.state || 'RUNNING' });

      while (
        status.state !== 'FINISHED' &&
        status.state !== 'STOPPED' &&
        Date.now() - startTime < ((argv.timeout as number) || 300000)
      ) {
        progressBar.update(status.progress, { state: status.state || 'RUNNING' });
        await new Promise((resolve) => setTimeout(resolve, (argv.pollInterval as number) || 2000));
        status = await zap.spider.spiderStatus(scanId);
      }

      progressBar.update(100, { state: status.state || 'FINISHED' });
      progressBar.stop();

      if (status.state === 'FINISHED') {
        log.success('Spider scan completed successfully!');
        const fullResults = await zap.spider.spiderFullResults(scanId);
        log.success(`Found ${fullResults.results?.length || 0} URLs`);
      } else {
        log.warn(`Scan ended with status: ${status.state}`);
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
