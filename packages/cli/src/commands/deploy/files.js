import {existsSync} from 'fs';
import getLocalPathConfig from './local-path';
import loadJSON from 'load-json-file';

export function readLocalConfig({error}, prefix) {
	const target = getLocalPathConfig(prefix || process.cwd());
	let localConfigExists;

	try {
		localConfigExists = existsSync(target);
	} catch (err) {
		error('Failed to check if `fleet.json` exists', null);
		process.exit(1);
	}

	if (localConfigExists) {
		try {
			return loadJSON.sync(target);
		} catch (err) {
			if (err.name === 'JSONError') {
				error(err.message, null);
			} else {
				const code = err.code ? `(${err.code})` : '';
				error(`Failed to read the \`fleet.json\` file ${code}`, null);
			}

			process.exit(1);
		}
	}

	return null;
}
