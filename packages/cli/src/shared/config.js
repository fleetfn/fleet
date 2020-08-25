import loadJSON from 'load-json-file';
import writeJSON from 'write-json-file';

import {error, highlight} from './logger';
import {getFleetDir} from './fleet-dir';

function joinPath(...segments) {
	const joinedPath = segments.join('/');
	return joinedPath.replace(/\/{2,}/g, '/');
}

const FLEET_DIR = getFleetDir();
const AUTH_CONFIG_FILE_PATH = joinPath(FLEET_DIR, 'auth.json');

export const readAuthConfigFile = () => {
	if (process.env.FLEET_API_TOKEN) {
		return {
			token: process.env.FLEET_API_TOKEN,
		};
	}

	return loadJSON.sync(AUTH_CONFIG_FILE_PATH);
};

export const writeToAuthConfigFile = (stuff) => {
	try {
		return writeJSON.sync(AUTH_CONFIG_FILE_PATH, stuff, {
			indent: 2,
			mode: 0o600,
		});
	} catch (err) {
		if (err.code === 'EPERM') {
			console.error(
				error(
					`Not able to create ${highlight(
						AUTH_CONFIG_FILE_PATH
					)} (operation not permitted).`
				)
			);
			process.exit(1);
		} else if (err.code === 'EBADF') {
			console.error(
				error(
					`Not able to create ${highlight(
						AUTH_CONFIG_FILE_PATH
					)} (bad file descriptor).`
				)
			);
			process.exit(1);
		}

		throw err;
	}
};
