import yargs from 'yargs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const getVersionCommand: yargs.CommandModule = {
  command: 'get-version',
  describe: 'Get ZAP version',
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

    try {
      const version = await zap.core.getVersion();
      log.info(`ZAP Version: ${version}`);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};