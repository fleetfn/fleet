/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import path from 'path';
import fs from 'fs-extra';
import loadJSON from 'load-json-file';

import report from '../reporter';
import type {Workfunc} from './fleet-config';

const FRAMEWORKS_COMPILED_PATH = {
  'triton.config.js': '.triton/build-manifest.json',
} as const;

const FRAMEWORKS_CONFIG = ['triton.config.js'] as const;

type Manifest = {
  compiledFunctionsDir: string;
  functions: Array<Workfunc>;
};

export async function getFramework(
  pathDir: string
): Promise<Manifest | undefined> {
  const [manifestPath] = await Promise.all(
    FRAMEWORKS_CONFIG.filter(
      async (config) => await fs.ensureFile(path.join(pathDir, config))
    ).map((config) => FRAMEWORKS_COMPILED_PATH[config])
  );

  let manifest;

  try {
    manifest = loadJSON.sync(manifestPath);
  } catch (err: any) {
    if (err.name === 'JSONError') {
      report.panic(err.message);
    } else {
      const code = err.code ? `(${err.code})` : '';
      report.panic(`Failed to read the \`fleet.json\` file ${code}`);
    }
  }

  return manifest as Manifest;
}
