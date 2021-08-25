/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import updateNotifier from 'update-notifier';
import util from 'util';

import {createCli} from './create-cli';
import pkg from './shared/pkg';
import report from './reporter';

// Check if update is available
updateNotifier({
  pkg: {
    name: pkg.name,
    version: pkg.version,
  },
}).notify();

process.on('unhandledRejection', (reason) => {
  if (!(reason instanceof Error)) {
    reason = new Error(util.format(reason));
  }

  report.panic(reason as Error);
});

process.on('uncaughtException', (error) => {
  report.panic(error);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

createCli(pkg.version);
