/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import ms from 'ms';
import chalk from 'chalk';

function elapsed(time: number, ago = false) {
  return chalk.gray(
    `[${time < 1000 ? `${time}ms` : ms(time)}${ago ? ' ago' : ''}]`
  );
}

export default (start = Date.now()) => {
  return () => elapsed(Date.now() - start);
};
