import yargs from 'yargs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const gcCommand: yargs.CommandModule = {
  command: 'gc',
  describe: 'Run ZAP garbage collection to free up memory',
  builder: (yargs) => {
    return yargs;
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    log.info('Running ZAP garbage collection...');

    try {
      await zap.core.runGarbageCollection();
      log.success('Garbage collection completed');
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
