import {existsSync, readFileSync} from 'fs';
import {join, extname} from 'path';
import loadJSON from 'load-json-file';
import YAML from 'yaml';

function getConfigPath(prefix) {
  const configYaml = join(prefix, 'fleet.yml');
  const configJson = join(prefix, 'fleet.json');

  if (existsSync(configYaml)) {
    return configYaml;
  } else if (existsSync(configJson)) {
    return configJson;
  }

  return null;
}

function getConfigJson(error, path) {
  try {
    return loadJSON.sync(path);
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

function getConfigYaml(error, path) {
  try {
    const file = readFileSync(path, 'utf8');
    const content = YAML.parse(file);
    const functions = [];

    if (content.functions) {
      Object.keys(content.functions).forEach((key) => {
        functions.push({name: key, ...content.functions[key]});
      });

      return {
        ...content,
        functions,
      };
    }

    return content;
  } catch (err) {
    const code = err.code ? `(${err.code})` : '';
    error(`Failed to parse the \`fleet.yml\` file ${code}`, null);

    process.exit(1);
  }
}

export function getLocalConfig({error}, prefix) {
  const path = getConfigPath(prefix);

  if (!path) {
    return null;
  }

  const ext = extname(path);

  switch (ext) {
    case '.json':
      return getConfigJson(error, path);
    case '.yml':
      return getConfigYaml(error, path);
    default:
      return null;
  }
}
