/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import merge from 'webpack-merge';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

import report from '../../reporter';

type Bundle = {
  functions: Record<string, string>;
  errors: Array<Record<string, string>>;
};

function filterByExtension(ext: string) {
  return (v: string) => v.endsWith('.' + ext);
}

export function build(entryFiles: Array<string> = [], debug: string) {
  return new Promise<Bundle>(async (resolve, reject) => {
    const entryFilesWithName: Record<string, string> = {};

    entryFiles.forEach((entry) => {
      entryFilesWithName[entry.replace(path.extname(entry), '')] = entry;
    });

    const userWebpackConfigPath = path.join(process.cwd(), 'webpack.config');
    let userWebpackConfig;

    try {
      // eslint-disable-next-line no-undef
      // @ts-ignore
      userWebpackConfig = await __non_webpack_require__(
        userWebpackConfigPath + '.js'
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}

    let config = {
      entry: entryFilesWithName,
      mode: 'production' as const,
      target: 'node',
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            parallel: true,
          }),
        ] as any,
      },
      module: {
        rules: [
          {
            include: /node_modules/,
            test: /\.mjs$/,
            type: 'javascript/auto',
          },
        ],
      },
      output: {
        filename: '[name].[contenthash].js',
        libraryTarget: 'commonjs2',
        path: path.resolve(process.cwd(), 'dist'),
      },
    };

    if (userWebpackConfig) {
      config = merge(config, userWebpackConfig);
    }

    const compiler = webpack(config);

    let lastHash: string | undefined = '';

    const compilerCallback = (
      err: Error | undefined,
      stats: webpack.Stats | undefined
    ) => {
      if (err) {
        reject(err);
        return;
      }

      if (!stats) {
        reject('No build statistics');
        return;
      }

      if (stats.hash !== lastHash) {
        const jsonStats = stats.toJson('minimal');
        const bundle: Bundle = {
          functions: {},
          errors: jsonStats.errors ?? [],
        };

        const jsAssets = Object.keys(stats.compilation.assets).filter(
          filterByExtension('js')
        );

        jsAssets.forEach((assetKey) => {
          const asset = stats.compilation.assetsInfo.get(assetKey);
          const handler = assetKey.replace(`.${asset?.contenthash}`, '');

          if (debug) {
            report.debug(
              `Build ${handler} (${assetKey}) in ${config.output.path}.`
            );
          }

          bundle.functions[handler] = path.join(config.output.path, assetKey);
        });

        resolve(bundle);
      }

      lastHash = stats.hash;
    };

    compiler.run((err, stats) => {
      compiler.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }

        compilerCallback(err, stats);
      });
    });
  });
}
