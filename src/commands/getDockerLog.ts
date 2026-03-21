import yargs from 'yargs';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { initLoggerWithWorkspace, getWorkspacePath } from '../utils/workspace';
import { log } from '../utils/logger';

export const getDockerLogCommand: yargs.CommandModule = {
  command: 'getDockerLog',
  describe: 'Get Docker container logs and write to agent.log',
  builder: (yargs) => {
    return yargs
      .option('container', {
        alias: 'c',
        type: 'string',
        demandOption: true,
        description: 'Docker container name or ID',
      })
      .option('workspace', {
        alias: 'w',
        type: 'string',
        description: 'Workspace directory (default: ZAPSTER_WORKSPACE env)',
      })
      .option('name', {
        alias: 'n',
        type: 'string',
        default: 'agent.log',
        description: 'Output filename',
      })
      .option('tail', {
        alias: 't',
        type: 'number',
        default: 500,
        description: 'Number of lines to fetch from the end',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const container = argv.container as string;
    const tailLines = argv.tail as number;
    const filename = (argv.name as string) || 'agent.log';

    try {
      log.info(`Fetching logs for container: ${container}`);

      const logs = execSync(
        `docker logs --tail ${tailLines} ${container}`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      const logPath = getWorkspacePath(filename);
      fs.writeFileSync(logPath, logs, 'utf-8');

      log.success(`Docker logs saved to: ${logPath}`);
      log.info(`Log size: ${logs.length} characters`);
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
