/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {Fleet, Objects, APIError} from '@fleetfn/sdk';
import chalk from 'chalk';
import prompts from 'prompts';
import simpleGit from 'simple-git/promise';

import {build} from './build';
import {getFramework} from '../../shared/frameworks';
import {getLinkedProject, linkFolderToProject} from './link';
import {getLocalConfig, FleetConfig} from '../../shared/fleet-config';
import {readAuthConfigFile} from '../../shared/config';
import humanizePath from '../../shared/humanize-path';
import report from '../../reporter';
import stamp from '../../shared/stamp';
import type {Bundle} from './build';

const {Environment, File} = Objects;

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

enum Stage {
  PRODUCTION = 'PRODUCTION',
  PREVIEW = 'PREVIEW',
}

export default async function deploy(isVerbose: string, isProd: string) {
  const path = process.cwd();
  const git = simpleGit();

  let localConfig = getLocalConfig(path);

  const manifest = getFramework(path);

  if (manifest) {
    localConfig = {
      ...(localConfig ?? {}),
      functions: manifest.functions,
    } as FleetConfig;
  }

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

      const projects = await fleet.project.all();

      const project = await prompts({
        type: 'select',
        name: 'value',
        message: 'Which project do you want to deploy?',
        choices: projects.data.map((project) => ({
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

    let bundle: Bundle | undefined;

    if (!manifest) {
      const entryFiles = localConfig.functions.map((func: any) =>
        func.handler.startsWith('./') ? func.handler : `./${func.handler}`
      );

      const buildTime = stamp();
      report.log('Build started...');

      bundle = await build(path, entryFiles, isVerbose, localConfig.env);

      if (bundle.errors.length > 0) {
        bundle.errors.forEach(({message}) => report.error(message));

        return report.panic('Exiting with error on compilation.');
      }

      report.log(`Build finished ${chalk.gray.bold(buildTime())}`);
    }

    const deployTime = stamp();

    try {
      let commit_head;

      try {
        const log = await git.log();
        commit_head = transformGitHead(log.latest);
      } catch (error) {
        // Hide the error assuming the repository has no git
      }

      const {name} = await fleet.project.project(link.projectId);

      report.log(
        `Deploying ${chalk.bold(
          humanizePath(path)
        )} to the project ${chalk.bold(name)}\n`
      );

      const environment = new Environment({
        metadata: {
          git_commit_latest: commit_head,
        },
        project_id: link.projectId,
        regions: localConfig.regions,
        functions: localConfig.functions.map(({http, name, ...data}) => ({
          http,
          name,
          metadata: {
            asynchronous: data.asynchronousThreshold,
            filename: data.handler,
            sha: 'test',
            size: 0,
            timeout: data.timeout,
          },
        })),
        stage: isProd ? Stage.PRODUCTION : Stage.PREVIEW,
      });

      const progress = report.progress('Creating deployment');

      const {url, functions} = await fleet.deployment.create(environment);

      functions.forEach(({id, filename}) => {
        const path = bundle?.functions[filename] ?? filename;

        if (isVerbose) {
          report.debug(`Deploying the ${filename} function of path ${path}`);
        }

        environment.files.push(new File({path, handler: filename, id}));
      });

      progress.text = 'Uploading deployments artifacts';

      const files = await fleet.deployment.deploy(environment);

      const failedDeployments = files.filter(
        (data) => typeof data === 'object'
      );

      // Checks if any deployment has initialized or error, if it is positive,
      // avoid giving a validate and the deployment must be created again.
      if (failedDeployments.length > 0) {
        try {
          await fleet.deployment.commit(environment);
          // eslint-disable-next-line no-empty
        } catch (_) {}

        progress.fail(`Project ${name} failed to deploy ${deployTime()}\n`);
        report.log(report.format.red('Error:'));
        report.log(
          `Unable to deploy ${chalk.bold(
            String(failedDeployments.length)
          )} functions.`
        );
        report.panic(failedDeployments[0] as unknown as APIError);
      } else {
        const commit = await fleet.deployment.commit(environment);

        progress.succeed(`Service deployed ${deployTime()}`);

        report.log(`\n${report.format.gray('functions:')}`);
        report.log(`   ${files.length} deployed`);
        report.log(`${report.format.gray('deployment endpoint:')}`);
        report.log(`   https://${url}`);

        report.log(
          `\n${report.format.gray('Ready! Deployed')} ${report.format.hex(
            '#0678FE'
          )(`https://${commit.url}`)}`
        );
      }
    } catch (err) {
      report.panic(err as Error);
    }
  }
}
