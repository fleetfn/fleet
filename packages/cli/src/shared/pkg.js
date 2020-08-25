import path from 'path';
import pkg from '../../package.json';

try {
	const distDir = path.dirname(process.execPath);
	pkg._npmPkg = require(`${path.join(distDir, '../../package.json')}`);
} catch (err) {
	pkg._npmPkg = null;
}

export default pkg;
