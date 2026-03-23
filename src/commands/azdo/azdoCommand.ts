import yargs from 'yargs';
import { createTestResultCommand } from './createTestResult';
import { createWorkItemCommand } from './createWorkItem';

export const azdoCommand: yargs.CommandModule = {
  command: 'azdo',
  describe: 'Azure DevOps integration commands',
  builder: (yargs) => {
    return yargs
      .command(createTestResultCommand)
      .command(createWorkItemCommand)
      .demandCommand(1, 'Specify an azdo subcommand');
  },
  handler: () => {
    yargs.showHelp();
  },
};