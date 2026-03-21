import yargs from 'yargs';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';

export const passiveScanCommand: yargs.CommandModule = {
  command: 'passiveScan',
  describe: 'Manage passive scanning settings',
  builder: (yargs) => {
    return yargs
      .option('enable', {
        alias: 'e',
        type: 'boolean',
        description: 'Enable passive scanning',
      })
      .option('disable', {
        alias: 'd',
        type: 'boolean',
        description: 'Disable passive scanning',
      })
      .option('status', {
        alias: 's',
        type: 'boolean',
        description: 'Show passive scan status and pending records',
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
      if (argv.status) {
        const records = await zap.pscan.passiveScanRecordsToScan();
        log.info(`Passive scan records pending: ${records.count}`);
      } else if (argv.enable) {
        await zap.pscan.passiveScanEnable();
        log.success('Passive scanning enabled');
      } else if (argv.disable) {
        await zap.pscan.passiveScanDisable();
        log.success('Passive scanning disabled');
      } else {
        const records = await zap.pscan.passiveScanRecordsToScan();
        log.info(`Passive scan records pending: ${records.count}`);
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
