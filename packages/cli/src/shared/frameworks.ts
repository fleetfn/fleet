/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import fs, {constants} from 'fs';
import loadJSON from 'load-json-file';
import path from 'path';

import report from '../reporter';
import type {Workfunc} from './fleet-config';

const FRAMEWORKS_COMPILED_PATH = {
  'triton.config.js': '.triton/build-manifest.json',
} as const;

const FRAMEWORKS_CONFIG = ['triton.config.js'] as const;

export type Manifest = {
  compiledFunctionsDir: string;
  functions: Array<Workfunc>;
};

export function getFramework(pathDir: string): Manifest | undefined {
  const [manifestPath] = FRAMEWORKS_CONFIG.filter((config) => {
    try {
      fs.accessSync(
        path.join(pathDir, config),
        constants.R_OK | constants.W_OK
      );

      return true;
    } catch (_) {
      return false;
    }
  }).map((config) => FRAMEWORKS_COMPILED_PATH[config]);

  if (!manifestPath) {
    return;
  }

  try {
    const manifest: any = loadJSON.sync(path.join(pathDir, manifestPath));

    if (manifest.functions) {
      manifest.functions = Object.keys(manifest.functions).reduce<
        Array<Workfunc>
      >((prev, key) => {
        return [
          ...prev,
          {
            name: key,
            ...manifest.functions[key],
          },
        ];
      }, []);
    }

    return manifest;
  } catch (err: any) {
    if (err.name === 'JSONError') {
      report.panic(err.message);
    } else {
      const code = err.code ? `(${err.code})` : '';
      report.panic(`Failed to read the \`${manifestPath}\` file ${code}`);
    }
  }
}
