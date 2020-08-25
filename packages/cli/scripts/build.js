const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const config = {
	entry: './src/index.js',
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
	externals: ['webpack', 'terser-webpack-plugin', 'xdg-app-paths'],
	output: {
		filename: 'fleet.js',
		libraryTarget: 'commonjs2',
		path: path.resolve(process.cwd(), 'dist'),
	},
};

const compiler = webpack(config);

let lastHash = '';
const compilerCallback = (err, stats) => {
	if (err) {
		throw err;
	}

	if (stats.hash !== lastHash) {
		const jsonStats = stats.toJson('minimal');

		if (jsonStats.errors.length) {
			console.error(jsonStats.errors);
		}

		console.log('Build finished...');
	}
	lastHash = stats.hash;
};

console.log('Build started...');

compiler.run(compilerCallback);
