/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import prompts from 'prompts';

import report from '../reporter';
import {writeToAuthConfigFile} from '../shared/config';

export default async function auth(token: string) {
  if (!token) {
    const response = await prompts({
      type: 'text',
      name: 'token',
      message: 'Type your Personal Access Token:',
    });

    token = response.token;
  }

  if (!token) {
    report.panic(
      'You must pass the token before you can use the Fleet CLI features.'
    );
  }

  writeToAuthConfigFile({token});

  report.success(
    `You are now authenticated. In order to deploy something, run ${report.cmd(
      'fleet'
    )}.`
  );
}
