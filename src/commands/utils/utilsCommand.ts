import yargs from 'yargs';
import { createJUnitResultsCommand } from './createJUnitResults';
import { getPdfCommand } from './getPdf';

export const utilsCommand: yargs.CommandModule = {
  command: 'utils',
  describe: 'Utility commands for reports and exports',
  builder: (yargs) => {
    return yargs
      .command(createJUnitResultsCommand)
      .command(getPdfCommand)
      .demandCommand(1, 'Specify a utils subcommand');
  },
  handler: () => {
    yargs.showHelp();
  },
};