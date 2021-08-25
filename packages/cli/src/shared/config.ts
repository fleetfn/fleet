/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import loadJSON from 'load-json-file';
import report from '../reporter';
import writeJSON from 'write-json-file';

import {getFleetDir} from './fleet-dir';

function joinPath(...segments: Array<string>) {
  const joinedPath = segments.join('/');
  return joinedPath.replace(/\/{2,}/g, '/');
}

const FLEET_DIR = getFleetDir();
const AUTH_CONFIG_FILE_PATH = joinPath(FLEET_DIR, 'auth.json');

export const readAuthConfigFile = () => {
  if (process.env.FLEET_API_TOKEN) {
    return {
      token: process.env.FLEET_API_TOKEN,
    };
  }

  return loadJSON.sync(AUTH_CONFIG_FILE_PATH);
};

type Config = {
  token: string;
};

export const writeToAuthConfigFile = (config: Config) => {
  try {
    return writeJSON.sync(AUTH_CONFIG_FILE_PATH, config, {
      indent: 2,
      mode: 0o600,
    });
  } catch (err: any) {
    if (err.code === 'EPERM') {
      report.panic(
        `Not able to create ${report.highlight(
          AUTH_CONFIG_FILE_PATH
        )} (operation not permitted).`
      );
    } else if (err.code === 'EBADF') {
      report.panic(
        `Not able to create ${report.highlight(
          AUTH_CONFIG_FILE_PATH
        )} (bad file descriptor).`
      );
    }

    throw err;
  }
};
