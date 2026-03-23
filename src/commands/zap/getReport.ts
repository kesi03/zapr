import yargs from 'yargs';
import * as fs from 'fs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace, getWorkspacePath } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const getReportCommand: yargs.CommandModule = {
  command: 'get-report',
  describe: 'Generate a security report in various formats',
  builder: (yargs) => {
    return yargs
      .option('format', {
        alias: 'f',
        type: 'string',
        choices: ['xml', 'json', 'md', 'html'],
        demandOption: true,
        description: 'Report format',
      })
      .option('workspace', {
        alias: 'w',
        type: 'string',
        description: 'Workspace directory (default: ZAPR_WORKSPACE env)',
      })
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Output filename',
      })
      .option('title', {
        type: 'string',
        description: 'Report title',
      })
      .option('template', {
        type: 'string',
        description: 'Report template name',
      })
      .option('description', {
        type: 'string',
        description: 'Report description',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    log.info(`Generating ${(argv.format as string).toUpperCase()} report...`);

    try {
      let report: string;
      const format = argv.format as 'xml' | 'json' | 'md' | 'html';

      switch (format) {
        case 'xml':
          report = await zap.reports.getXmlReport();
          break;
        case 'json':
          const jsonReport = await zap.reports.getJsonReport();
          report = JSON.stringify(jsonReport, null, 2);
          break;
        case 'md':
          report = await zap.reports.getMdReport();
          break;
        case 'html':
          report = await zap.reports.getHtmlReport();
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      if (argv.name) {
        const outputPath = getWorkspacePath(argv.name as string);
        fs.writeFileSync(outputPath, report, 'utf-8');
        log.success(`Report saved to: ${outputPath}`);
      } else {
        log.info(report);
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};