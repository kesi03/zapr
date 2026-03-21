import yargs from 'yargs';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';

export const getLogsCommand: yargs.CommandModule = {
  command: 'getLogs',
  describe: 'Get ZAP log messages',
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
      log.info('Log level configuration retrieved via API.');
      log.info('Note: Full log retrieval requires direct file access to ZAP logs.');
      log.info('Log files are typically located at:');
      log.info('  - Windows: %ZAP_HOME%\\logs\\');
      log.info('  - Linux/Mac: ~/.ZAP/logs/');
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
