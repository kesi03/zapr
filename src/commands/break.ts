import yargs from 'yargs';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';

export const breakCommand: yargs.CommandModule = {
  command: 'break',
  describe: 'Manage break points for request/response interception',
  builder: (yargs) => {
    return yargs
      .option('add', {
        type: 'boolean',
        description: 'Add a new break point',
      })
      .option('type', {
        type: 'string',
        choices: ['request', 'response'],
        description: 'Break on request or response',
      })
      .option('scope', {
        type: 'string',
        choices: ['all', 'mock', 'suite', 'tag'],
        default: 'all',
        description: 'Break scope',
      })
      .option('state', {
        type: 'string',
        choices: ['all', 'on', 'off'],
        default: 'on',
        description: 'Break state',
      })
      .option('match', {
        type: 'string',
        description: 'URL regex pattern to match',
      })
      .option('list', {
        alias: 'l',
        type: 'boolean',
        description: 'List all break points',
      })
      .option('continue', {
        alias: 'c',
        type: 'boolean',
        description: 'Continue the intercepted request/response',
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
      if (argv.add) {
        await zap.break.addBreak(
          argv.type as string || 'request',
          argv.scope as string || 'all',
          argv.state as string || 'on',
          argv.match as string || '.*'
        );
        log.success(`Break point added: ${argv.type} - ${argv.match}`);
      } else if (argv.list) {
        const breakpoints = await zap.break.breakpoints();
        log.info('Break points:');
        if (breakpoints.breakpoints && breakpoints.breakpoints.length > 0) {
          breakpoints.breakpoints.forEach((bp: any) => {
            log.info(`  Type: ${bp.type}, Scope: ${bp.scope}, State: ${bp.state}, Match: ${bp.match}`);
          });
        } else {
          log.info('  No break points set');
        }
      } else if (argv.continue) {
        await zap.break.continue();
        log.success('Request/response continued');
      } else {
        log.warn('Use --add, --list, or --continue');
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
