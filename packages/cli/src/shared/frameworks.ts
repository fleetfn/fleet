/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import path from 'path';
import fs from 'fs-extra';

const FRAMEWORKS_COMPILED_PATH = {
  'triton.config.js': '.triton/functions',
} as const;

const FRAMEWORKS_CONFIG = ['triton.config.js'] as const;

export async function getFrameworks(
  pathDir: string
): Promise<string | undefined> {
  const [framework] = await Promise.all(
    FRAMEWORKS_CONFIG.filter(
      async (config) => await fs.ensureFile(path.join(pathDir, config))
    ).map((config) => FRAMEWORKS_COMPILED_PATH[config])
  );

  return framework;
}
