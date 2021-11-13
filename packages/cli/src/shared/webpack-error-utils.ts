/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import type {StatsCompilation} from 'webpack';

import {formatWebpackMessages} from './format-webpack-messages';
import report from '../reporter';

export function reportWebpackWarnings(
  warnings: StatsCompilation['warnings'] = []
): void {
  let warningMessages: Array<string> = [];
  if (typeof warnings[0] === 'string') {
    warningMessages = warnings as unknown as Array<string>;
  } else if (warnings[0]?.message && warnings[0]?.moduleName) {
    warningMessages = warnings.map(
      (warning) => `${warning.moduleName}\n\n${warning.message}`
    );
  } else if (warnings[0]?.message) {
    warningMessages = warnings.map((warning) => warning.message);
  }

  formatWebpackMessages({
    errors: [],
    warnings: warningMessages,
  }).warnings.forEach((warning: string) => report.warn(warning, null));
}
