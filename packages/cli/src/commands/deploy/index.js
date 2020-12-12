import {Fleet, Objects} from '@fleetfn/sdk';
import chalk from 'chalk';
import program from 'commander';
import prompts from 'prompts';
import simpleGit from 'simple-git/promise';

import {build} from './build';
import {cmd, createLogger} from '../../shared/logger';
import {getLinkedProject, linkFolderToProject} from './link';
import {readAuthConfigFile} from '../../shared/config';
import {getLocalConfig} from './files';
import humanizePath from '../../shared/humanize-path';
import stamp from './stamp';

const {Environment, File} = Objects;

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
  const localConfig = getLocalConfig(logger, path);

  if (!localConfig) {
    warn(
      `Your project is missing a ${chalk.bold('fleet.yml')} file.`,
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
        )} property in the ${chalk.bold('fleet.yml')} file.`,
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

    const fleet = new Fleet({token: AUTH_CONFIG.token});

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

      const {projects} = await fleet.project.all();

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
        initial: 0,
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
      let commit_head;

      try {
        commit_head = transformGitHead(await (await git.log()).latest);
      } catch (error) {
        // Hide the error assuming the repository has no git
      }

      const environment = new Environment({
        commit_head,
        environment_variables: localConfig.env,
        project_id: link.projectId,
        regions: localConfig.regions,
        resources: localConfig.functions,
        stage: isProd ? 'prod' : 'dev',
      });

      const {
        domain,
        error: errorMessage,
        functionDomain,
        functions,
        message,
        name,
      } = await fleet.deployment.create(environment);

      log(
        `Deploying ${chalk.bold(
          humanizePath(path)
        )} to the project ${chalk.bold(name)}`
      );

      if (errorMessage) {
        throw message ? message : errorMessage;
      }

      log(`${chalk.cyan.bold(`https://${functionDomain}`)}`);

      functions.forEach(({_id, handler}) => {
        const path = bundle.functions[handler];

        debug(`Deploying the ${handler} function of path ${path}`);

        environment.files.push(new File({path, handler, id: _id}));
      });

      const deployments = await fleet.deployment.deploy(environment);

      const failedDeployments = deployments.filter(
        (deploy) => deploy.code !== READY
      );

      // Checks if any deployment has initialized or error, if it is positive,
      // avoid giving a validate and the deployment must be created again.
      if (failedDeployments.length > 0) {
        log(
          `Fail! Unable to deploy ${chalk.bold(
            failedDeployments.length
          )} functions. Try again! ${chalk.gray.bold(deployTime())}`
        );
        return 1;
      } else {
        const {deployPoint} = await fleet.deployment.commit(environment);

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
