import yargs from 'yargs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const forcedBrowseCommand: yargs.CommandModule = {
  command: 'forced-browse',
  describe: 'Run forced browsing (dirb-style) scan',
  builder: (yargs) => {
    return yargs
      .option('scan', {
        alias: 's',
        type: 'string',
        description: 'Start a forced browse scan on URL',
      })
      .option('stop', {
        type: 'string',
        description: 'Stop a scan by ID',
      })
      .option('status', {
        type: 'boolean',
        description: 'Show status of all forced browse scans',
      })
      .option('context', {
        alias: 'c',
        type: 'string',
        description: 'Context name for the scan',
      })
      .option('poll-interval', {
        type: 'number',
        default: 5000,
        description: 'Polling interval in ms',
      })
      .option('timeout', {
        type: 'number',
        default: 300000,
        description: 'Maximum time to wait in ms',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    try {
      if (argv.scan) {
        const result = await zap.forcedBrowse.scan(
          argv.scan as string,
          argv.context as string | undefined
        );
        log.info(`Forced browse scan started: ${result.scanId}`);

        const startTime = Date.now();
        let scans = await zap.forcedBrowse.scans() as any;
        let currentScan = scans.scans?.find((s: any) => s.scanId === result.scanId);

        while (currentScan && currentScan.state === 'RUNNING' && Date.now() - startTime < ((argv.timeout as number) || 300000)) {
          log.info(`Scan progress: ${currentScan.progress || 0}% - ${currentScan.requestsCount || 0} requests`);
          await new Promise((resolve) => setTimeout(resolve, (argv.pollInterval as number) || 5000));
          scans = await zap.forcedBrowse.scans() as any;
          currentScan = scans.scans?.find((s: any) => s.scanId === result.scanId);
        }

        log.success(`Forced browse scan completed: ${result.scanId}`);
      } else if (argv.stop) {
        await zap.forcedBrowse.stop(argv.stop as string);
        log.success(`Scan ${argv.stop} stopped`);
      } else if (argv.status) {
        const scans = await zap.forcedBrowse.scans();
        log.info('Forced browse scans:');
        if (scans.scans && scans.scans.length > 0) {
          scans.scans.forEach((scan: any) => {
            log.info(`  ID: ${scan.scanId}, URL: ${scan.url}, State: ${scan.state}, Progress: ${scan.progress || 0}%`);
          });
        } else {
          log.info('  No active scans');
        }
      } else {
        log.warn('Use --scan, --stop, or --status');
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};