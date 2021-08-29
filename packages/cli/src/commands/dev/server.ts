/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import http, {IncomingMessage, ServerResponse} from 'http';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

export function createDevServer(callback: Handler) {
  const server = http.createServer(callback);

  function listen(ip: string, port: string) {
    return new Promise<void>((resolve) =>
      server.listen(Number(port), ip, () => resolve())
    );
  }

  return {
    listen,
  };
}
