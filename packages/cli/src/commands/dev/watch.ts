/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import chokidar from 'chokidar';
import fs from 'fs-extra';
import ms from 'ms';
import path from 'path';
import webpack from 'webpack';

import {createFunctionManifest} from './manifest';
import {formatWebpackMessages} from '../../shared/format-webpack-messages';
import {getLocalConfig} from '../../shared/fleet-config';
import {reportWebpackWarnings} from '../../shared/webpack-error-utils';
import report from '../../reporter';
import store, {Actions} from './store';

function getFleetFunctionConfig(pathDir: string) {
  const localConfig = getLocalConfig(pathDir);

  if (!localConfig) {
    return report.panic(
      `Your project is missing a ${report.format.bold('fleet.yml')} file.`
    );
  }

  if (!localConfig.functions) {
    return report.panic(
      `Your project is missing the ${report.format.yellow.blue(
        'functions'
      )} property in the ${report.format.bold('fleet.yml')} file.`
    );
  }

  return localConfig;
}

async function createWebpackConfig(
  compiledFunctionsDir: string,
  pathDir: string
) {
  const localConfig = getFleetFunctionConfig(pathDir);

  const manifest = createFunctionManifest(
    pathDir,
    compiledFunctionsDir,
    localConfig.functions
  );

  store.dispatch({payload: manifest, type: Actions.ADD_MANIFEST});

  const env = localConfig.env ?? {};
  const nodeEnv = process.env.NODE_ENV || 'development';

  const processEnv = Object.keys(env).reduce<Record<string, string>>(
    (accumulator, key) => {
      accumulator[`process.env.${key}`] = JSON.stringify(env[key]);

      return accumulator;
    },
    {'process.env': '({})'}
  );

  return {
    entry: manifest.entries,
    output: {
      path: compiledFunctionsDir,
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    target: 'node',
    optimization: {
      minimize: false,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    cache: {
      type: 'filesystem' as const,
      name: nodeEnv,
      cacheLocation: path.join(
        pathDir,
        '.fleet',
        'cache',
        'webpack',
        'stage-' + nodeEnv
      ),
    },
    mode: 'development' as const,
    module: {
      rules: [
        {
          test: [/.js$/, /.ts$/],
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [require('@babel/preset-typescript')],
            },
          },
        },
      ],
    },
    resolveLoader: {
      modules: [
        path.resolve(__dirname, '../../../../node_modules'),
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(__dirname, '../../node_modules'),
        path.resolve(__dirname, '../node_modules'),
        'node_modules',
      ],
    },
    plugins: [new webpack.DefinePlugin(processEnv)],
  };
}

export async function watch(pathDir: string) {
  const spinnerStop = report.createSpinner('Compiling Fleet Functions');

  let isFirstBuild = true;

  const compiledFunctionsDir = path.join(
    pathDir,
    '.fleet',
    'cache',
    'functions'
  );

  store.dispatch({
    payload: compiledFunctionsDir,
    type: Actions.ADD_COMPILED_DIR,
  });

  await fs.ensureDir(compiledFunctionsDir);
  await fs.emptyDir(compiledFunctionsDir);

  try {
    const config = await createWebpackConfig(compiledFunctionsDir, pathDir);

    const compilerCallback = (
      err: Error | undefined,
      stats: webpack.Stats | undefined
    ) => {
      if (!stats) {
        throw new Error('Failed to compile, stats not available.');
      }

      let rawMessages = stats.toJson({moduleTrace: false});

      if (!rawMessages) {
        rawMessages = {
          warnings: [],
          errors: [],
        };
      }

      if (rawMessages.warnings && rawMessages.warnings.length > 0) {
        reportWebpackWarnings(rawMessages.warnings);
      }

      if (err) {
        throw err;
      }

      const formatted = formatWebpackMessages({
        errors: rawMessages.errors
          ? rawMessages.errors.map((e) => e.message)
          : [],
        warnings: [],
      });

      if (formatted.errors.length > 0) {
        formatted.errors.forEach((error: Error) => report.error(error));
      }

      if (isFirstBuild) {
        isFirstBuild = false;
      } else {
        const time = stats.endTime - stats.startTime;
        report.success(
          `Rebuilt functions ${report.format.gray(
            `[${time < 1000 ? `${time}ms` : ms(time)}]`
          )}`
        );
      }
    };

    let compiler = webpack(config).watch({}, compilerCallback);

    chokidar
      // Watch the Fleet configuration files to see if a function has been
      // added or removed.
      .watch([`${pathDir}/fleet.yml`, `${pathDir}/fleet.json`], {
        ignoreInitial: true,
      })
      .on('all', async (event, path) => {
        report.log(
          `Restarting the Function watcher due to change to ${report.format.bold(
            path
          )}`
        );

        compiler.close(async () => {
          const config = await createWebpackConfig(
            compiledFunctionsDir,
            pathDir
          );
          compiler = webpack(config).watch({}, compilerCallback);
        });
      });
  } catch (_) {
    report.panic('Failed to compile Fleet Functions');
  }

  spinnerStop();
}
