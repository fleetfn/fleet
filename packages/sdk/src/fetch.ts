/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {Agent} from 'https';
import chalk from 'chalk';
import nFetch from 'node-fetch';
import type {RequestInit} from 'node-fetch';

function error(message: string) {
  process.stderr.write(
    `${chalk.red('>')} ${chalk`{red.bold Error!} ${message}`}\n`
  );
}

type Options = RequestInit & {
  apiUrl: string;
  json?: boolean;
  token: string;
};

export default async function fetch({
  apiUrl,
  body,
  headers = {},
  json = true,
  method = 'POST',
  token,
}: Options) {
  const options = {
    agent: new Agent({
      keepAlive: true,
      maxFreeSockets: 20,
      maxSockets: 200,
      timeout: 60000,
    }),
    body,
    method,
    headers: {
      ...headers,
      'User-Agent': 'Fleet SDK/v1.0.0-alpha.3',
      Authorization: `Bearer ${token}`,
    },
  };

  if (json) {
    // @ts-ignore
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return nFetch(apiUrl, options)
    .then((res) => {
      if (res.headers.get('content-type')?.includes('application/json')) {
        return res.json();
      }

      return res.text();
    })
    .then((res) => {
      if (res.code) {
        throw res;
      }

      return res;
    });
}
