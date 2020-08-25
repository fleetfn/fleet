import {homedir} from 'os';
import fs from 'fs';
import path from 'path';
import XDGAppPaths from 'xdg-app-paths';

const homeConfigPath = path.join(homedir(), '.fleet');

const isDirectory = (path) => {
	try {
		return fs.lstatSync(path).isDirectory();
	} catch (_) {
		return false;
	}
};

export const getFleetDir = () => {
	const xdgConfigPaths = XDGAppPaths('fleet').dataDirs();
	const possibleConfigPaths = [homeConfigPath, ...xdgConfigPaths];

	return (
		possibleConfigPaths.find((configPath) => isDirectory(configPath)) ||
		xdgConfigPaths[0]
	);
};
