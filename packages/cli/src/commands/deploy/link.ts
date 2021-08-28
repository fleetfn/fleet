/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {ensureDir} from 'fs-extra';
import {join} from 'path';
import {promisify} from 'util';
import chalk from 'chalk';
import fs from 'fs';

import report from '../../reporter';

const FLEET_FOLDER = '.fleet';
const FLEET_PROJECT = 'project.json';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export const getLinkedProject = async (path: string) => {
  try {
    if (process.env.FLEET_PROJECT_ID) {
      return {
        projectId: process.env.FLEET_PROJECT_ID,
      };
    }

    const json = await readFile(join(path, FLEET_FOLDER, FLEET_PROJECT), {
      encoding: 'utf8',
    });

    let link;

    try {
      link = JSON.parse(json);

      if (link && !link.projectId) {
        throw new Error();
      }
    } catch (err) {
      report.error(
        'Fleet project settings are invalid. Try the link again, delete the `fleet.json` directory.'
      );
      return;
    }

    return link;
  } catch (error: any) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) {
      return null;
    }

    throw error;
  }
};

type ConfigLink = {
  projectId: string;
};

export const linkFolderToProject = async (
  path: string,
  projectLink: ConfigLink,
  projectName: string
) => {
  await ensureDir(join(path, FLEET_FOLDER));

  await writeFile(
    join(path, FLEET_FOLDER, FLEET_PROJECT),
    JSON.stringify(projectLink),
    {encoding: 'utf8'}
  );

  try {
    const gitIgnorePath = join(path, '.gitignore');

    const gitIgnore = await readFile(gitIgnorePath)
      .then((buf) => buf.toString())
      .catch(() => null);

    if (!gitIgnore || !gitIgnore.split('\n').includes('.fleet')) {
      await writeFile(
        gitIgnorePath,
        gitIgnore ? `${gitIgnore}\n.fleet` : '.fleet'
      );
    }
    // eslint-disable-next-line no-empty
  } catch (error) {}

  report.log(
    `Linked to ${chalk.bold(projectName)} ${chalk.gray(
      '(created .fleet)\n\n'
    )}`,
    '🔗  '
  );
};
