import {Agent} from 'https';
import chalk from 'chalk';
import nFetch from 'node-fetch/lib/index';

function error(message) {
  process.stderr.write(
    `${chalk.red('>')} ${chalk`{red.bold Error!} ${message}`}\n`
  );
}

export default function fetch({
  apiUrl,
  body,
  headers,
  json = true,
  method = 'POST',
  token,
}) {
  const options = {
    agent: new Agent({
      freeSocketKeepAliveTimeout: 30000,
      freeSocketTimeout: 30000,
      keepAlive: true,
      maxFreeSockets: 20,
      maxSockets: 200,
      timeout: 60000,
    }),
    credentials: true,
    method,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = body;
  }

  if (json) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return nFetch(apiUrl, options)
    .then((res) => {
      if (res.ok) {
        return res;
      }

      return Promise.reject(
        new Error(`Failed to fetch ${res.url}: ${res.status} ${res.statusText}`)
      );
    })
    .then((res) => res.json())
    .catch((err) => error(err));
}
