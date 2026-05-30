import yargs from 'yargs';
import { ZapClient } from '../../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../../utils/workspace';
import { log } from '../../../utils/logger';

export const runCrawlAndScanCommand: yargs.CommandModule = {
  command: 'run-crawl-and-scan <url>',
  describe: 'Run Playwright crawl and scan against a URL',
  builder: (yargs) => {
    return yargs
      .positional('url', {
        type: 'string',
        describe: 'Target URL to scan',
        demandOption: true,
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
      const result = await zap.playwrightClient.runCrawlAndScan(argv.url as string);
      log.info(`Response: ${JSON.stringify(result)}`);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
