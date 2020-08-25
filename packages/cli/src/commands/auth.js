import program from 'commander';
import prompts from 'prompts';

import {cmd, createLogger} from '../shared/logger';
import {writeToAuthConfigFile} from '../shared/config';

export default async (argv) => {
	const {error, success} = createLogger();

	program.option('-t, --token <token>', 'Login token');

	program.parse(argv);

	let token = program.token;

	if (!token) {
		const response = await prompts({
			type: 'text',
			name: 'token',
			message: 'Type your Personal Access Token:',
		});

		token = response.token;
	}

	if (!token) {
		error(
			'You must pass the token before you can use the Fleet CLI features.',
			null
		);
		return;
	}

	writeToAuthConfigFile({token});

	success(
		`You are now authenticated. In order to deploy something, run ${cmd(
			'fleet'
		)}.`
	);
};
