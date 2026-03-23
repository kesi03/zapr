import yargs from 'yargs';
import * as fs from 'fs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace, getWorkspacePath } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const getAlertsCommand: yargs.CommandModule = {
  command: 'get-alerts',
  describe: 'Get ZAP alerts with optional filtering',
  builder: (yargs) => {
    return yargs
      .option('base-url', {
        alias: 'u',
        type: 'string',
        description: 'Filter alerts by base URL',
      })
      .option('start', {
        type: 'number',
        default: 0,
        description: 'Start index for pagination',
      })
      .option('count', {
        type: 'number',
        description: 'Maximum number of alerts to return',
      })
      .option('workspace', {
        alias: 'w',
        type: 'string',
        description: 'Workspace directory (default: ZAPSTER_WORKSPACE env)',
      })
      .option('name', {
        alias: 'n',
        type: 'string',
        description: 'Output filename',
      })
      .option('summary', {
        alias: 's',
        type: 'boolean',
        description: 'Show alerts summary by risk level',
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
      if (argv.summary) {
        const summary = await zap.alerts.getAlertsSummary();
        const riskConf = summary.RiskConf || summary || {};
        log.info('Alerts Summary:');
        log.info(`  High: ${riskConf.High || 0}`);
        log.info(`  Medium: ${riskConf.Medium || 0}`);
        log.info(`  Low: ${riskConf.Low || 0}`);
        log.info(`  Informational: ${riskConf.Informational || 0}`);
        log.info(`  False Positive: ${riskConf.FalsePositive || 0}`);
      } else {
        const response = await zap.alerts.getAlerts(
          argv.baseUrl as string | undefined,
          argv.start as number | undefined,
          argv.count as number | undefined
        );

        log.info(`Found ${response.alerts.length} alerts`);

        if (argv.name) {
          const outputPath = getWorkspacePath(argv.name as string);
          fs.writeFileSync(outputPath, JSON.stringify(response.alerts, null, 2), 'utf-8');
          log.success(`Alerts saved to: ${outputPath}`);
        } else {
          response.alerts.forEach((alert) => {
            log.info(`[${alert.risk}] ${alert.alert}`);
            log.info(`  URL: ${alert.url}`);
            log.info(`  Parameter: ${alert.param}`);
            log.info(`  Solution: ${alert.solution || 'N/A'}`);
          });
        }
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};