import yargs from 'yargs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const searchCommand: yargs.CommandModule = {
  command: 'search',
  describe: 'Search ZAP URLs and messages by regex',
  builder: (yargs) => {
    return yargs
      .option('regex', {
        alias: 'r',
        type: 'string',
        demandOption: true,
        description: 'Regular expression to search for',
      })
      .option('urls', {
        alias: 'u',
        type: 'boolean',
        description: 'Search URLs matching regex',
      })
      .option('messages', {
        alias: 'm',
        type: 'boolean',
        description: 'Search HTTP messages matching regex',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    const regex = argv.regex as string;

    try {
      if (argv.urls) {
        const results = await zap.search.urlsByRegex(regex) as { urls: string[] };
        log.info(`URLs matching "${regex}":`);
        if (results.urls && results.urls.length > 0) {
          results.urls.forEach((url: string) => log.info(`  ${url}`));
        } else {
          log.info('  No URLs found');
        }
      } else if (argv.messages) {
        const results = await zap.search.messagesByRegex(regex);
        log.info(`Messages matching "${regex}":`);
        if (results.messages && (results.messages as any[]).length > 0) {
          log.info(`  Found ${(results.messages as any[]).length} messages`);
        } else {
          log.info('  No messages found');
        }
      } else {
        log.warn('Use --urls or --messages');
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};