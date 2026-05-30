import yargs from 'yargs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ZapClient } from '../../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../../utils/workspace';
import { log } from '../../../utils/logger';

export const uploadConfigCommand: yargs.CommandModule = {
  command: 'upload-config <file>',
  describe: 'Upload a config file (.yaml/.yml/.json/.properties/.conf) to ZAP',
  builder: (yargs) => {
    return yargs
      .positional('file', {
        type: 'string',
        describe: 'Path to the config file',
        demandOption: true,
      })
      .option('name', {
        alias: 'n',
        type: 'string',
        describe: 'Target filename in ZAP (defaults to basename of input file)',
      })
      .option('overwrite', {
        type: 'boolean',
        describe: 'Overwrite if file already exists',
        default: false,
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
      const filePath = resolve(argv.file as string);
      const content = readFileSync(filePath);
      const fileContent = content.toString('base64');
      const fileName = (argv.name as string) || filePath.split(/[/\\]/).pop()!;
      const result = await zap.configUploader.uploadConfig(fileName, fileContent, argv.overwrite as boolean);
      log.info(result.result);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
