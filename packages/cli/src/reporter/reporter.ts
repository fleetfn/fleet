/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import ora, {Ora} from 'ora';
import SDK from '@fleetfn/sdk';

import {getErrorFormatter} from './errors';

const errorFormatter = getErrorFormatter();

class Reporter {
  format = chalk;

  panic = (error: SDK.APIError | Error | string) => {
    this.error(error);
    return process.exit(1);
  };

  error = (error: SDK.APIError | Error | string) => {
    if (error instanceof Error) {
      this.log(errorFormatter.render(error));
    } else if (
      (error as SDK.APIError).code &&
      (error as SDK.APIError).message &&
      (error as SDK.APIError).type
    ) {
      this.log(
        `${this.format.bold((error as SDK.APIError).type)} ${
          (error as SDK.APIError).message
        }`
      );
    } else {
      this.log(`${this.format.red.bold('Error!')} ${error}`);
    }
  };

  blank = () => {
    process.stderr.write('\n');
  };

  success = (text: string) => {
    this.log(`${this.format.green.bold('Success!')} ${text}`);
  };

  highlight = (text: string) => {
    return this.format.underline(text);
  };

  cmd = (text: string) => {
    return `${this.format.gray('`')}${this.format.cyan(text)}${this.format.gray(
      '`'
    )}`;
  };

  warn = (text: string, slug: string | null) => {
    this.log(`${this.format.yellow.bold('Warn!')} ${text}`);

    if (slug !== null) {
      this.log(`More details: https://fleetfn.com/docs/${slug}`);
    }
  };

  log = (text: string) => {
    process.stderr.write(`${text}\n`);
  };

  debug = (text: string) => {
    this.log(
      `${this.format.bold('[debug]')} ${this.format.gray(
        `[${new Date().toISOString()}]`
      )} ${text}`
    );
  };

  progress = (text: string) => {
    const spinner: Ora = ora({
      color: 'gray',
      text,
    });

    return spinner;
  };

  createSpinner = (text: string) => {
    const spinner: Ora = ora({
      color: 'gray',
      text,
    });

    spinner.start();

    return function stop() {
      spinner.stop();
      process.stderr.write(ansiEscapes.eraseLines(1));
    };
  };
}

export type {Reporter};
export const reporter = new Reporter();
