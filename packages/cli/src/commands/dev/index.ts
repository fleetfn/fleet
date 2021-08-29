/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import report from '../../reporter';
import {createDevServer} from './server';
import {createDevRouter} from './router';
import {watch} from './watch';

export default async function dev(ip: string, port: string) {
  const path = process.cwd();

  report.log('Fleet Development environment', false);

  await watch(path);

  const server = createDevServer(createDevRouter());

  await server.listen(ip, port);

  report.log(
    `Listening on ${report.format.bold(`http://${ip}:${port}`)}\n`,
    false
  );
  report.log('Log data will stream in below: \n', false);
}
