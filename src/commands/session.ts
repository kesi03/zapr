import yargs from 'yargs';
import { ZapClient } from '../zap/ZapClient';
import { initLoggerWithWorkspace } from '../utils/workspace';
import { log } from '../utils/logger';

export const sessionCommand: yargs.CommandModule = {
  command: 'session',
  describe: 'Manage ZAP sessions (create, save, load)',
  builder: (yargs) => {
    return yargs
      .option('new', {
        alias: 'n',
        type: 'string',
        description: 'Create a new session with the given name',
      })
      .option('save', {
        alias: 's',
        type: 'string',
        description: 'Save current session with the given name',
      })
      .option('overwrite', {
        type: 'boolean',
        default: false,
        description: 'Overwrite existing session file',
      })
      .option('sites', {
        alias: 'l',
        type: 'boolean',
        description: 'List all sites in current session',
      })
      .option('urls', {
        alias: 'u',
        type: 'boolean',
        description: 'List all URLs in current session',
      })
      .option('access-url', {
        alias: 'a',
        type: 'string',
        description: 'Access a URL and capture responses',
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
      if (argv.new) {
        await zap.core.newSession(argv.new as string, argv.overwrite as boolean);
        log.success(`New session created: ${argv.new}`);
      } else if (argv.save) {
        await zap.core.saveSession(argv.save as string, argv.overwrite as boolean);
        log.success(`Session saved: ${argv.save}`);
      } else if (argv.sites) {
        const sites = await zap.core.getSites();
        log.info('Sites:');
        sites.sites.forEach((site) => log.info(`  ${site}`));
      } else if (argv.urls) {
        const urls = await zap.core.getUrls();
        log.info('URLs:');
        urls.urls.forEach((url) => log.info(`  ${url}`));
      } else if (argv.accessUrl) {
        await zap.core.accessUrl(argv.accessUrl as string);
        log.info(`Accessing URL: ${argv.accessUrl}`);
      } else {
        log.warn('Use --new, --save, --sites, --urls, or --access-url');
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};
