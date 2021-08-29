/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import path from 'path';

import type {Workfunc} from '../../shared/fleet-config';

export type FunctionManifest = Workfunc & {
  compiledFilePath: string;
  functionPathRegex: string;
  sourceFilePath: string;
};

export type Manifest = {
  functions: Array<FunctionManifest>;
  entries: Record<string, string>;
};

const PROXY_RESOURCES_ANY = '/:proxy+';
const PROXY_RESOURCES_ANY_REGEX = '/.*';
const PROXY_RESOURCES_PARAM_REGEX = '/([\\w-]+)';

function createPathRegex(path: string) {
  if (path.includes(PROXY_RESOURCES_ANY)) {
    path = path.replace(PROXY_RESOURCES_ANY, PROXY_RESOURCES_ANY_REGEX);
  }

  return `^${path.replace(/\/:[^\s/]+/g, PROXY_RESOURCES_PARAM_REGEX)}$`;
}

export function createFunctionManifest(
  pathDir: string,
  compiledFunctionsDir: string,
  functions: Array<Workfunc>
) {
  const entries: Record<string, string> = {};

  return {
    functions: functions.map<FunctionManifest>((workfunc) => {
      const sourceFilePath = path.join(pathDir, workfunc.handler);
      const sourceRelativeFilePath = path.relative(pathDir, sourceFilePath);

      const {dir, name} = path.parse(sourceRelativeFilePath);

      const compiledFunctionName = path.join(dir, name + '.js');
      const compiledFilePath = path.join(
        compiledFunctionsDir,
        compiledFunctionName
      );

      entries[path.join(dir, name)] = sourceFilePath;

      return {
        ...workfunc,
        compiledFilePath,
        functionPathRegex: createPathRegex(workfunc.http.path),
        sourceFilePath,
      };
    }),
    entries,
  };
}
