/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import path from 'path';

type Package = {
  version: string;
  name: string;
};

let pkg: Package;

try {
  const distDir = path.dirname(process.execPath);
  pkg = require(`${path.join(distDir, '../../package.json')}`);
} catch (err) {
  pkg = {
    version: 'undefined',
    name: '@fleetfn/cli',
  };
}

export default pkg;
