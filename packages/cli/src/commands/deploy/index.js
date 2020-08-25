import {Fleet} from '@fleetfn/sdk';
import chalk from 'chalk';
import fs from 'fs';
import program from 'commander';
import prompts from 'prompts';
import simpleGit from 'simple-git/promise';

import {build} from './build';
import {cmd, createLogger} from '../../shared/logger';
import {getLinkedProject, linkFolderToProject} from './link';
import {readAuthConfigFile} from '../../shared/config';
import {readLocalConfig} from './files';
import humanizePath from '../../shared/humanize-path';
import stamp from './stamp';

const READY = 'READY';

const transformGitHead = (log) => {
	if (!log) {
		return undefined;
	}

	return {
		date: log.date,
		hash: log.hash,
		message: log.message,
		refs: log.refs,
	};
};

export default async (argv) => {
	program
		.option('-p, --prod', 'Sets the deployment to production')
		.option(
			'-v, --verbose',
			'The Fleet CLI will print all the deployment steps'
		);

	program.parse(argv);

	const isProd = program.prod;
	const isVerbose = program.verbose;

	const logger = createLogger({debug: isVerbose});
	const {log, debug, error, warn, print} = logger;

	const path = process.cwd();
	const git = simpleGit();
	const localConfig = readLocalConfig(logger, path);

	if (!localConfig) {
		warn(
			`Your project is missing a ${chalk.bold('fleet.json')} file.`,
			'configuration.html'
		);
		return 1;
	} else {
		let link;

		try {
			link = await getLinkedProject(logger, path);
		} catch (err) {
			error(err, null);
			return 1;
		}

		if (!localConfig.functions) {
			warn(
				`Your project is missing the ${chalk.yellow.blue(
					'functions'
				)} property in the ${chalk.bold('fleet.json')} file.`,
				'configuration.html'
			);
			return 1;
		}

		let AUTH_CONFIG;

		try {
			AUTH_CONFIG = readAuthConfigFile();
		} catch (err) {
			warn(
				`Configure CLI Authentication, run ${cmd('fleet auth -t <token>')}.`,
				'fleet-cli.html'
			);
			return 1;
		}

		if (AUTH_CONFIG && !AUTH_CONFIG.token) {
			warn(
				'You need to add a personal access token to deploy!',
				'fleet-cli.html'
			);
			return 1;
		}

		const client = new Fleet({apiKey: AUTH_CONFIG.token});

		// Folder not linked to the project
		if (!link) {
			const response = await prompts({
				type: 'confirm',
				name: 'value',
				message: `Set up and deploy ${chalk.bold(humanizePath(path))}?`,
				initial: true,
			});

			if (!response.value) {
				print('😔  Aborted. The project has not been configured.\n');
				return 1;
			}

			const {projects} = await client.project.all();

			const project = await prompts({
				type: 'select',
				name: 'value',
				message: 'Which project do you want to deploy?',
				choices: projects.map((project) => ({
					title: project.name,
					value: {
						id: project.id,
						name: project.name,
					},
				})),
				initial: 1,
			});

			if (!project.value) {
				print('😅  Aborted. You need to choose a project.\n');
				return 1;
			}

			link = {projectId: project.value.id};

			await linkFolderToProject(logger, path, link, project.value.name);
		}

		const entryFiles = localConfig.functions.map((func) =>
			func.handler.startsWith('./') ? func.handler : `./${func.handler}`
		);

		const buildTime = stamp();
		log('Build started...');

		const bundle = await build(entryFiles, debug);

		if (bundle.errors.length > 0) {
			error(bundle.errors, null);
			return 1;
		}

		log(`Build finished ${chalk.gray.bold(buildTime())}`);

		const deployTime = stamp();

		try {
			let commitHead;

			try {
				commitHead = transformGitHead(await (await git.log()).latest);
			} catch (error) {
				// Hide the error assuming the repository has no git
			}

			const {
				deployUid,
				domain,
				error: errorMessage,
				functionDomain,
				functions,
				message,
				name,
			} = await client.deploy.create({
				// Normalizes the handler extensions, once the build is done locally
				// we need to normalize to `.js` when file is ts.
				functions: localConfig.functions.map((func) => {
					const newFunc = {...func};

					/// Only add the latest git commit if the repo supports git
					if (commitHead) {
						newFunc.gitCommitLatest = commitHead;
					}

					const handler = func.handler.startsWith('./')
						? func.handler
						: `./${func.handler}`;

					return {
						...newFunc,
						handler: handler.replace('.ts', '.js'),
					};
				}),
				prod: isProd,
				projectId: link.projectId,
				regions: localConfig.regions,
			});

			log(
				`Deploying ${chalk.bold(
					humanizePath(path)
				)} to the project ${chalk.bold(name)}`
			);

			if (errorMessage) {
				throw message ? message : errorMessage;
			}

			log(`${chalk.cyan.bold(`https://${functionDomain}`)}`);

			const deployments = await client.deploy.files(
				functions.map((func) => {
					debug(
						`Deploying the ${func.handler} function of path ${
							bundle.functions[func.handler]
						}`
					);

					return {
						data: fs.createReadStream(bundle.functions[func.handler]),
						handler: func.handler,
						functionId: func._id,
					};
				})
			);

			const deployFail = deployments.filter((deploy) => deploy.code !== READY);

			// Checks if any deployment has initialized or error, if it is positive,
			// avoid giving a validate and the deployment must be created again.
			if (deployFail.length > 0) {
				log(
					`Fail! Unable to deploy ${chalk.bold(
						deployFail.length
					)} functions. Try again! ${chalk.gray.bold(deployTime())}`
				);
				return 1;
			} else {
				// Validates the deployment, updating the deploy point and other details.
				const {deployPoint} = await client.deploy.validate({
					deployUid,
					env: localConfig.env,
					prod: isProd,
					projectId: link.projectId,
					regions: localConfig.regions,
				});

				if (deployPoint && isProd) {
					log(
						`${chalk.gray('Ready! Deployed')} ${chalk.cyan.bold(
							`https://${domain}`
						)} ${chalk.gray.bold(deployTime())}`
					);
				} else {
					log(
						`${chalk.gray('Ready! Deployed')} ${chalk.cyan.bold(
							`https://${functionDomain}`
						)} ${chalk.gray.bold(deployTime())}`
					);
				}
			}
		} catch (err) {
			error(err, null);
			return 1;
		}
	}
};
