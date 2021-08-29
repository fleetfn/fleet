/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {Fleet, Objects} from '@fleetfn/sdk';
import chalk from 'chalk';
import prompts from 'prompts';
import simpleGit from 'simple-git/promise';

import {build} from './build';
import {getLinkedProject, linkFolderToProject} from './link';
import {getLocalConfig} from '../../shared/fleet-config';
import {readAuthConfigFile} from '../../shared/config';
import humanizePath from '../../shared/humanize-path';
import report from '../../reporter';
import stamp from '../../shared/stamp';

const {Environment, File} = Objects;

const READY = 'READY';

const transformGitHead = (log: any) => {
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

export default async function deploy(isVerbose: string, isProd: string) {
  const path = process.cwd();
  const git = simpleGit();
  const localConfig = getLocalConfig(path);

  if (!localConfig) {
    report.warn(
      `Your project is missing a ${chalk.bold('fleet.yml')} file.`,
      'configuration.html'
    );
    return;
  } else {
    let link;

    try {
      link = await getLinkedProject(path);
    } catch (err) {
      return report.panic(err as any);
    }

    if (!localConfig.functions) {
      return report.panic(
        `Your project is missing the ${chalk.yellow.blue(
          'functions'
        )} property in the ${chalk.bold('fleet.yml')} file.`
      );
    }

    let AUTH_CONFIG;

    try {
      AUTH_CONFIG = readAuthConfigFile();
    } catch (err) {
      return report.panic(
        `Configure CLI Authentication, run ${report.cmd(
          'fleet auth -t <token>'
        )}.`
      );
    }

    if (AUTH_CONFIG && !AUTH_CONFIG.token) {
      return report.panic('You need to add a personal access token to deploy!');
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
        return report.panic('Aborted. The project has not been configured.');
      }

      const {projects} = await fleet.project.all();

      const project = await prompts({
        type: 'select',
        name: 'value',
        message: 'Which project do you want to deploy?',
        choices: projects.map((project: any) => ({
          title: project.name,
          value: {
            id: project.id,
            name: project.name,
          },
        })),
        initial: 0,
      });

      if (!project.value) {
        return report.panic('Aborted. You need to choose a project.');
      }

      link = {projectId: project.value.id};

      await linkFolderToProject(path, link, project.value.name);
    }

    const entryFiles = localConfig.functions.map((func: any) =>
      func.handler.startsWith('./') ? func.handler : `./${func.handler}`
    );

    const buildTime = stamp();
    report.log('Build started...');

    const bundle = await build(entryFiles, isVerbose);

    if (bundle.errors.length > 0) {
      bundle.errors.forEach(({message}) => report.error(message));

      return report.panic('Exiting with error on compilation.');
    }

    report.log(`Build finished ${chalk.gray.bold(buildTime())}`);

    const deployTime = stamp();

    try {
      let commit_head;

      try {
        const log = await git.log();
        commit_head = transformGitHead(log.latest);
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

      report.log(
        `Deploying ${chalk.bold(
          humanizePath(path)
        )} to the project ${chalk.bold(name)}`
      );

      if (errorMessage) {
        throw message ? message : errorMessage;
      }

      report.log(`${chalk.cyan.bold(`https://${functionDomain}`)}`);

      functions.forEach(({_id, handler}: any) => {
        const path = bundle.functions[handler];

        if (isVerbose) {
          report.debug(`Deploying the ${handler} function of path ${path}`);
        }

        environment.files.push(new File({path, handler, id: _id}));
      });

      const deployments = await fleet.deployment.deploy(environment);

      const failedDeployments = deployments.filter(
        (deploy: any) => deploy.code !== READY
      );

      // Checks if any deployment has initialized or error, if it is positive,
      // avoid giving a validate and the deployment must be created again.
      if (failedDeployments.length > 0) {
        report.panic(
          `Fail! Unable to deploy ${chalk.bold(
            failedDeployments.length
          )} functions. Try again! ${chalk.gray.bold(deployTime())}`
        );
      } else {
        const {deployPoint} = await fleet.deployment.commit(environment);

        if (deployPoint && isProd) {
          report.log(
            `${chalk.gray('Ready! Deployed')} ${chalk.cyan.bold(
              `https://${domain}`
            )} ${chalk.gray.bold(deployTime())}`
          );
        } else {
          report.log(
            `${chalk.gray('Ready! Deployed')} ${chalk.cyan.bold(
              `https://${functionDomain}`
            )} ${chalk.gray.bold(deployTime())}`
          );
        }
      }
    } catch (err) {
      report.panic(err as Error);
    }
  }
}
