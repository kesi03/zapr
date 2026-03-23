import yargs from 'yargs';
import { ZapClient } from '../../zap/ZapClient';
import { initLoggerWithWorkspace } from '../../utils/workspace';
import { log } from '../../utils/logger';

export const proxyCommand: yargs.CommandModule = {
  command: 'proxy',
  describe: 'Manage proxy chain exclusions',
  builder: (yargs) => {
    return yargs
      .option('list', {
        alias: 'l',
        type: 'boolean',
        description: 'List excluded domains',
      })
      .option('add', {
        type: 'string',
        description: 'Add domain to exclusion list',
      })
      .option('regex', {
        type: 'boolean',
        default: false,
        description: 'Treat value as regex',
      })
      .option('disable', {
        type: 'boolean',
        default: false,
        description: 'Add as disabled',
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
      if (argv.list) {
        const domains = await zap.proxy.proxyChainExcludedDomains();
        log.info('Proxy chain excluded domains:');
        if (domains.excludedDomains && domains.excludedDomains.length > 0) {
          domains.excludedDomains.forEach((domain: any) => {
            log.info(`  ${domain.value} (Regex: ${domain.isRegex}, Enabled: ${domain.isEnabled})`);
          });
        } else {
          log.info('  No excluded domains');
        }
      } else if (argv.add) {
        await zap.proxy.addProxyChainExcludedDomain(
          argv.add as string,
          argv.regex as boolean,
          !(argv.disable as boolean)
        );
        log.success(`Domain added to exclusion list: ${argv.add}`);
      } else {
        log.warn('Use --list or --add');
      }
    } catch (error: any) {
      log.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },
};