import yargs from 'yargs';
import {
  runCrawlAndScanCommand,
  screenshotPageCommand,
  downloadScreenshotCommand,
} from './index';

export const addonsCommand: yargs.CommandModule = {
  command: 'addons',
  describe: 'Manage and interact with ZAP add-ons (playwrightclient, etc.)',
  builder: (yargs) => {
    return yargs
      .command(runCrawlAndScanCommand)
      .command(screenshotPageCommand)
      .command(downloadScreenshotCommand)
      .demandCommand(1, 'You must provide a sub-command');
  },
  handler: () => {},
};
