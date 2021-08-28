/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {Command} from 'commander';

import auth from './commands/auth';
import deploy from './commands/deploy';
import init from './commands/init';

export const createCli = (version: string) => {
  const cli = new Command();

  cli.version(version);

  cli
    .command('deploy', {isDefault: true})
    .description('Deploy your functions in the folder')
    .option('-p, --prod', 'Sets the deployment to production')
    .option(
      '-v, --verbose',
      'The Fleet CLI will print all the deployment steps'
    )
    .action((cmd) => deploy(cmd.verbose, cmd.prod));

  cli
    .command('auth')
    .description('Authorization to the platform')
    .option('-t, --token <token>', 'Login token')
    .action((cmd) => auth(cmd.token));

  cli
    .command('init [example]')
    .description('Start a new project from an example')
    .action((example) => init(example));

  cli.parse(process.argv);
};
