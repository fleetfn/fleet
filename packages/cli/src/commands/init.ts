/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import chalk from 'chalk';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import prompts from 'prompts';
import AdmZip from 'adm-zip';

import report from '../reporter';
import {getFleetDir} from '../shared/fleet-dir';
import humanizePath from '../shared/humanize-path';

const FLEET_DIR = getFleetDir();
const FLEET_EXAMPLES_REPOSITORY =
  'https://github.com/fleetfn/examples/archive/master.zip';
const FLEET_LIST =
  'https://raw.githubusercontent.com/fleetfn/examples/master/list.json';

const FLEET_EXAMPLES_ZIP = path.join(FLEET_DIR, 'fleet-examples.zip');

export default async function init(example: string) {
  let examples: Array<string>;

  try {
    const response = await fetch(FLEET_LIST);

    if (response.status !== 200) {
      return report.panic('Error getting the list of examples');
    }

    examples = await response.json();
  } catch (err) {
    return report.panic(err as Error);
  }

  if (!example || !examples.includes(example)) {
    const exampleSelected = await prompts({
      type: 'select',
      name: 'value',
      message: 'Select an example:',
      choices: examples.map((name) => ({
        title: name,
        value: name,
      })),
      initial: 0,
    });

    if (!exampleSelected.value) {
      return report.panic('Aborted. You need to choose an example.');
    }

    example = exampleSelected.value;
  }

  const cwd = process.cwd();
  const folder = path.join(cwd, example);

  if (folder === cwd) {
    return report.panic('Aborted. You need to choose an example.');
  }

  if (fs.existsSync(folder)) {
    const force = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'The directory already exists, do you want to force it?',
      initial: true,
    });

    report.blank();

    if (!force.value) {
      return report.log('Aborted.');
    }
  } else {
    try {
      fs.mkdirSync(folder);
    } catch (err) {
      return report.panic(err as Error);
    }
  }

  try {
    const stopSpinner = report.createSpinner(`Fetching ${example}`);
    const response = await fetch(FLEET_EXAMPLES_REPOSITORY);

    stopSpinner();

    if (response.status !== 200) {
      return report.panic(`Could not get ${FLEET_EXAMPLES_REPOSITORY}`);
    }

    await new Promise((resolve, reject) => {
      const fleetExamplesOutput = fs.createWriteStream(FLEET_EXAMPLES_ZIP);
      response.body.on('error', reject);
      fleetExamplesOutput.on('error', reject);
      fleetExamplesOutput.on('finish', resolve);
      response.body.pipe(fleetExamplesOutput);
    });

    const zip = new AdmZip(FLEET_EXAMPLES_ZIP);

    zip.extractEntryTo(`examples-master/${example}/`, folder, false, true);

    report.log(
      `${chalk.gray.bold(
        humanizePath(folder)
      )} folder created with the ${chalk.bold(example)} example.`
    );

    const relative = path.relative(cwd, folder);

    report.log(
      relative === ''
        ? `To deploy, run ${report.cmd('fleet deploy')}`
        : `To deploy, run ${report.cmd(`cd ${relative} && fleet deploy`)}`
    );
  } catch (err) {
    report.panic(err as Error);
  }
}
