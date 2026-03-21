import yargs from 'yargs';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';

export const httpSessionsCommand: yargs.CommandModule = {
  command: 'httpSessions',
  describe: 'Manage HTTP sessions',
  builder: (yargs) => {
    return yargs
      .option('site', {
        alias: 's',
        type: 'string',
        demandOption: true,
        description: 'Site hostname (e.g., example.com)',
      })
      .option('list', {
        alias: 'l',
        type: 'boolean',
        description: 'List sessions for site',
      })
      .option('create', {
        alias: 'c',
        type: 'string',
        description: 'Create a new empty session',
      })
      .option('activate', {
        alias: 'a',
        type: 'string',
        description: 'Set active session by name',
      });
  },
  handler: async (argv) => {
    initLoggerWithWorkspace();
    const zap = new ZapClient({
      host: argv.host as string,
      port: argv.port as number,
      apiKey: argv.apiKey as string | undefined,
    });

    const site = argv.site as string;

    try {
      if (argv.list) {
        const sessions = await zap.httpSessions.sessions(site);
        log.info(`Sessions for ${site}:`);
        if (sessions.sessions && sessions.sessions.length > 0) {
          sessions.sessions.forEach((session: any) => {
            log.info(`  Name: ${session.name}, Active: ${session.active}`);
          });
        } else {
          log.info('  No sessions found');
        }
      } else if (argv.create) {
        await zap.httpSessions.createEmptySession(site, argv.create as string);
        log.success(`Session "${argv.create}" created for ${site}`);
      } else if (argv.activate) {
        await zap.httpSessions.setActiveSession(site, argv.activate as string);
        log.success(`Session "${argv.activate}" activated for ${site}`);
      } else {
        log.warn('Use --list, --create, or --activate');
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
