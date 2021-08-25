/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import PrettyError from 'pretty-error';

export function getErrorFormatter(): PrettyError {
  const prettyError = new PrettyError();
  const baseRender = prettyError.render;

  prettyError.skipNodeFiles();

  // @ts-ignore
  prettyError.skip((traceLine: any) =>
    Boolean(traceLine && traceLine.dir === 'internal/modules/cjs')
  );

  prettyError.appendStyle({
    'pretty-error': {
      marginTop: 1,
    },
    'pretty-error > header': {
      background: 'red',
    },
    'pretty-error > header > colon': {
      color: 'white',
    },
  });

  prettyError.render = (err: Error | Array<Error>): string => {
    if (Array.isArray(err)) {
      return err.map((e) => prettyError.render(e)).join('\n');
    }

    return baseRender.call(prettyError, err);
  };

  return prettyError;
}
