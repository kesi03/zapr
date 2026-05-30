import yargs from 'yargs';
import {
  runCrawlAndScanCommand,
  screenshotPageCommand,
  downloadScreenshotCommand,
  uploadAutomationCommand,
  uploadConfigCommand,
  uploadOpenApiCommand,
  uploadGraphQlCommand,
  applyConfigCommand,
} from './index';

export const addonsCommand: yargs.CommandModule = {
  command: 'addons',
  describe: 'Manage and interact with ZAP add-ons (playwrightclient, config-uploader, etc.)',
  builder: (yargs) => {
    return yargs
      .command(runCrawlAndScanCommand)
      .command(screenshotPageCommand)
      .command(downloadScreenshotCommand)
      .command(uploadAutomationCommand)
      .command(uploadConfigCommand)
      .command(uploadOpenApiCommand)
      .command(uploadGraphQlCommand)
      .command(applyConfigCommand)
      .demandCommand(1, 'You must provide a sub-command');
  },
  handler: () => {},
};
