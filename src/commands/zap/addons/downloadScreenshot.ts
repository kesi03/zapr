import yargs from 'yargs';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { ZapClient } from '../../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../../utils/workspace';
import { log } from '../../../utils/logger';

export const downloadScreenshotCommand: yargs.CommandModule = {
  command: 'download-screenshot [filename]',
  describe: 'Download a screenshot (PNG) taken by Playwright',
  builder: (yargs) => {
    return yargs
      .positional('filename', {
        type: 'string',
        describe: 'Screenshot filename (optional, downloads latest if omitted)',
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        describe: 'Output file path',
        default: './screenshot.png',
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
      const filename = argv.filename as string | undefined;
      const buffer = await zap.playwrightClient.downloadScreenshot(filename);
      const outPath = resolve(argv.output as string);
      writeFileSync(outPath, buffer);
      log.info(`Screenshot downloaded to ${outPath} (${buffer.length} bytes)`);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
