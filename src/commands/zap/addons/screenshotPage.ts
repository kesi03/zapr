import yargs from 'yargs';
import { ZapClient } from '../../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../../utils/workspace';
import { log } from '../../../utils/logger';

export const screenshotPageCommand: yargs.CommandModule = {
  command: 'screenshot-page <url>',
  describe: 'Take a screenshot of a URL via Playwright',
  builder: (yargs) => {
    return yargs
      .positional('url', {
        type: 'string',
        describe: 'URL to screenshot',
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
      const result = await zap.playwrightClient.screenshotPage(argv.url as string);
      log.info(`Screenshot saved to: ${result.result}`);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
