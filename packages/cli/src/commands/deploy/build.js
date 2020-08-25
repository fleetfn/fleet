import merge from 'webpack-merge';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

function filterByExtension(ext) {
	return (v) => v.endsWith('.' + ext);
}

export const build = (entryFiles = [], debug) => {
	return new Promise(async (resolve, reject) => {
		const entryFilesWithName = {};

		entryFiles.forEach((entry) => {
			entryFilesWithName[entry.replace(path.extname(entry), '')] = entry;
		});

		const userWebpackConfigPath = path.join(process.cwd(), 'webpack.config');
		let userWebpackConfig;

		try {
			// eslint-disable-next-line no-undef
			userWebpackConfig = await __non_webpack_require__(
				userWebpackConfigPath + '.js'
			);
			// eslint-disable-next-line no-empty
		} catch (e) {}

		let config = {
			entry: entryFilesWithName,
			mode: 'production',
			target: 'node',
			optimization: {
				minimize: true,
				minimizer: [
					new TerserPlugin({
						parallel: true,
					}),
				],
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
				filename: '[name].js',
				libraryTarget: 'commonjs2',
				path: path.resolve(process.cwd(), 'dist'),
			},
		};

		if (userWebpackConfig) {
			config = merge(config, userWebpackConfig);
		}

		const compiler = webpack(config);

		let lastHash = '';
		const compilerCallback = (err, stats) => {
			if (err) {
				reject(err);
				return;
			}

			if (stats.hash !== lastHash) {
				const assets = stats.compilation.assets;

				const jsonStats = stats.toJson('minimal');
				const bundle = {
					functions: {},
					errors: jsonStats.errors,
				};
				const jsAssets = Object.keys(assets).filter(filterByExtension('js'));

				jsAssets.forEach((assetKey) => {
					debug(`Build ${assetKey} in ${assets[assetKey].existsAt}.`);

					bundle.functions[assetKey] = assets[assetKey].existsAt;
				});

				resolve(bundle);
			}
			lastHash = stats.hash;
		};

		compiler.run(compilerCallback);
	});
};
