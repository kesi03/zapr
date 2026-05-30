import yargs from 'yargs';
import { ZapClient } from '../../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../../utils/workspace';
import { log } from '../../../utils/logger';

export const applyConfigCommand: yargs.CommandModule = {
  command: 'apply-config <filename>',
  describe: 'Apply scanner rule thresholds from an uploaded .conf file',
  builder: (yargs) => {
    return yargs
      .positional('filename', {
        type: 'string',
        describe: 'Name of the .conf file previously uploaded to ZAP config folder',
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
      const result = await zap.configUploader.applyConfig(argv.filename as string);
      log.info(result.result);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
