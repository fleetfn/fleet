import pkg from './shared/pkg';
import program from 'commander';

import commandAuth from './commands/auth';
import commandDeploy from './commands/deploy';
import commandInit from './commands/init';

export const main = (argv) => {
	program
		.version(pkg.version)
		.command('deploy --prod', 'Deploy your functions in the folder', {
			isDefault: true,
		})
		.command('auth -t <token>', 'Authorization to the platform')
		.command('init [example]', 'Start a new project from an example');

	program.parse(argv);
};

export const auth = commandAuth;
export const deploy = commandDeploy;
export const init = commandInit;
