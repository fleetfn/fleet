/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {IncomingMessage, ServerResponse} from 'http';
import fs from 'fs-extra';
import chokidar from 'chokidar';

import {request} from './request';
import {response} from './response';
import report from '../../reporter';
import store from './store';
import type {FunctionManifest} from './manifest';
import type {Method} from '../../shared/fleet-config';

async function shouldFunctionCompiled(workfunc: FunctionManifest) {
  const state = store.getState();

  let isCompiled = false;

  try {
    isCompiled = Boolean(await fs.stat(workfunc.compiledFilePath));

    // eslint-disable-next-line no-empty
  } catch (_) {}

  if (isCompiled) {
    return;
  }

  const time = new Date();

  fs.utimesSync(workfunc.sourceFilePath, time, time);

  // Wait until the file is ready to use.
  await new Promise((resolve) => {
    const watcher = chokidar
      .watch(state.compiledFunctionsDir)
      .on('add', async (path) => {
        if (path === workfunc.compiledFilePath) {
          await watcher.close();

          resolve(null);
        }
      });
  });
}

export function createDevRouter() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const path = req.url ?? '';
    const method = req.method ?? 'GET';

    const state = store.getState();

    const workfunc = state.manifest.functions.find((workfunc) => {
      return (
        workfunc.http.method.includes(method as Method) &&
        path.match(workfunc.functionPathRegex)
      );
    });

    if (workfunc) {
      await shouldFunctionCompiled(workfunc);

      report.log(
        `Function invoked ${report.format.bold(
          workfunc.name
        )}: path=${report.format.bold(path)}, method=${report.format.bold(
          method
        )}`
      );
      const start = Date.now();

      try {
        // Fleet CLI is compiled with webpack if adding `require` we cannot
        // load files out of context.
        // @ts-ignore
        delete __non_webpack_require__.cache[
          // @ts-ignore
          __non_webpack_require__.resolve(workfunc.compiledFilePath)
        ];
        // @ts-ignore
        const fn = __non_webpack_require__(workfunc.compiledFilePath);

        const execute = (fn && fn.default) || fn;

        await Promise.resolve(execute(await request(req), response(res)));
      } catch (error) {
        if ((error as Error).message.includes('execute is not a function')) {
          (
            error as Error
          ).message = `${workfunc.name} does not export a function.`;
        }

        report.error(error as Error);

        if (!res.headersSent) {
          res.writeHead(500);
          res.end();
        }
      }

      report.log(
        `Executed function ${report.format.bold(workfunc.name)} in ${
          Date.now() - start
        }ms`
      );
    } else {
      report.error(
        `No function exists for path (${report.format.bold(
          path
        )}) and method (${report.format.bold(method)})`
      );

      res.writeHead(404);
      res.end();
    }
  };
}
