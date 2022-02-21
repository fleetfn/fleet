/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {IncomingMessage, IncomingHttpHeaders} from 'http';
import {URL} from 'url';

const getBody = (req: IncomingMessage) => {
  return new Promise<any>((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => resolve(data));
  });
};

const getHeaders = (headers: IncomingHttpHeaders): IncomingHttpHeaders => {
  headers[':authority'] = 'fleet';

  return headers;
};

const getQuery = (req: IncomingMessage) => {
  if (!req.url) {
    return {};
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const query: Record<string, string> = {};

  for (const [key, value] of url.searchParams) {
    let decodedValue = decodeURI(value);

    try {
      if (
        (decodedValue.includes('[') && decodedValue.includes(']')) ||
        (decodedValue.includes('{') && decodedValue.includes('}'))
      ) {
        decodedValue = JSON.parse(decodedValue);
      }
      // eslint-disable-next-line no-empty
    } catch (_) {}

    query[key] = decodedValue;
  }

  return query;
};

export const request = async (req: IncomingMessage) => {
  const body = await getBody(req);

  return {
    headers: getHeaders(req.headers),
    body,
    ip: req.socket.remoteAddress,
    url: req.url,
    method: req.method,
    query: getQuery(req),
  };
};
