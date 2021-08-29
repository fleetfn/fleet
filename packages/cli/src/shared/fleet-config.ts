/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {existsSync, readFileSync} from 'fs';
import {join, extname} from 'path';
import loadJSON from 'load-json-file';
import YAML from 'yaml';

import report from '../reporter';

function getConfigPath(prefix: string) {
  const configYaml = join(prefix, 'fleet.yml');
  const configJson = join(prefix, 'fleet.json');

  if (existsSync(configYaml)) {
    return configYaml;
  } else if (existsSync(configJson)) {
    return configJson;
  }

  return null;
}

function getConfigJson(path: string) {
  try {
    return loadJSON.sync(path);
  } catch (err: any) {
    if (err.name === 'JSONError') {
      report.panic(err.message);
    } else {
      const code = err.code ? `(${err.code})` : '';
      report.panic(`Failed to read the \`fleet.json\` file ${code}`);
    }
  }
}

function getConfigYaml(path: string) {
  try {
    const file = readFileSync(path, 'utf8');
    const content = YAML.parse(file);
    const functions: Array<Record<string, string>> = [];

    if (content.functions) {
      Object.keys(content.functions).forEach((key) => {
        functions.push({name: key, ...content.functions[key]});
      });

      return {
        ...content,
        functions,
      };
    }

    return content;
  } catch (err: any) {
    const code = err.code ? `(${err.code})` : '';
    report.panic(`Failed to parse the \`fleet.yml\` file ${code}`);
  }
}

export type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'DELETE';

export type WorkfuncHttp = {
  method: Array<Method>;
  path: string;
};

export type Workfunc = {
  asynchronousThreshold: number;
  handler: string;
  http: WorkfuncHttp;
  name: string;
  timeout: number;
};

type FleetConfig = {
  env?: Record<string, string>;
  functions: Array<Workfunc>;
  regions: Array<string>;
};

export function getLocalConfig(prefix: string): FleetConfig | null {
  const path = getConfigPath(prefix);

  if (!path) {
    return null;
  }

  const ext = extname(path);

  switch (ext) {
    case '.json':
      return getConfigJson(path) as FleetConfig;
    case '.yml':
      return getConfigYaml(path);
    default:
      return null;
  }
}
