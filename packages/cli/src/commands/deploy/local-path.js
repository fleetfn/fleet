import path from 'path';

export default (prefix) => {
	return path.join(prefix, 'fleet.json');
};
