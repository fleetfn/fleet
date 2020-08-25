import chalk from 'chalk';
import fs from 'fs';
import nFetch from 'node-fetch/lib/index';
import path from 'path';
import program from 'commander';
import prompts from 'prompts';
import zip from 'adm-zip';

import {createLogger, cmd} from '../shared/logger';
import {getFleetDir} from '../shared/fleet-dir';
import humanizePath from '../shared/humanize-path';

const FLEET_DIR = getFleetDir();
const FLEET_EXAMPLES_REPOSITORY =
  'https://github.com/fleetfn/examples/archive/master.zip';
const FLEET_LIST =
  'https://raw.githubusercontent.com/fleetfn/examples/master/list.json';

const FLEET_EXAMPLES_ZIP = path.join(FLEET_DIR, 'fleet-examples.zip');

export default async (argv) => {
  const {log, print, error, spinner} = createLogger();

  program.arguments('[example]');

  program.parse(argv);

  let example = program.args[0];
  let examples;

  try {
    const response = await nFetch(FLEET_LIST);

    if (response.status !== 200) {
      error('Error getting the list of examples', null);
      return 1;
    }

    examples = await response.json();
  } catch (err) {
    error(err, null);
    return 1;
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
      print('-  Aborted. You need to choose an example.\n');
      return 1;
    }

    example = exampleSelected.value;
  }

  const cwd = process.cwd();
  const folder = path.join(cwd, example);

  if (folder === cwd) {
    print('-  Aborted. You need to choose an example.\n');
    return 1;
  }

  if (fs.existsSync(folder)) {
    const force = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'The directory already exists, do you want to force it?',
      initial: true,
    });
    print('\n');

    if (!force.value) {
      return 1;
    }
  } else {
    try {
      fs.mkdirSync(folder);
    } catch (err) {
      error(err, null);
      return 1;
    }
  }

  try {
    const stopSpinner = spinner(`Fetching ${example}`);
    const response = await nFetch(FLEET_EXAMPLES_REPOSITORY);
    stopSpinner();

    if (response.status !== 200) {
      error(`Could not get ${FLEET_EXAMPLES_REPOSITORY}`, null);
      return 1;
    }

    await new Promise((resolve, reject) => {
      const fleetExamplesOutput = fs.createWriteStream(FLEET_EXAMPLES_ZIP);
      response.body.on('error', reject);
      fleetExamplesOutput.on('error', reject);
      fleetExamplesOutput.on('finish', resolve);
      response.body.pipe(fleetExamplesOutput);
    });

    const z = zip(FLEET_EXAMPLES_ZIP);

    z.extractEntryTo(`examples-master/${example}/`, folder, false, true);

    log(
      `${chalk.gray.bold(
        humanizePath(folder)
      )} folder created with the ${chalk.bold(example)} example.`
    );

    const relative = path.relative(cwd, folder);

    print(
      relative === ''
        ? `-  To deploy, run ${cmd('fleet deploy')}`
        : `-  To deploy, run ${cmd(`cd ${relative} && fleet deploy`)}`
    );
    return 0;
  } catch (err) {
    error(err, null);
    return 1;
  }
};
