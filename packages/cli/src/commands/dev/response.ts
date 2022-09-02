/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {STATUS_CODES, ServerResponse} from 'http';

type PreSend = (payload: any) => Promise<any> | void;

const CONTENT_TYPE = {
  JSON: 'application/json; charset=utf-8',
  PLAIN: 'text/plain; charset=utf-8',
  OCTET: 'application/octet-stream',
};

class ErrorFactory {
  code: string;
  message: string;
  name: string;
  statusCode: number | undefined;

  constructor(code: string, message: string, statusCode: number = 500) {
    this.message = `${code}: ${message}`;
    this.code = code;
    this.statusCode = statusCode || undefined;
    this.name = `FleetError [${code}]`;
  }
}

export const response = (res: ServerResponse) => {
  const state = {
    hasStatusCode: false,
    headers: {} as Record<string, any>,
    preSend: null as null | PreSend,
    responseSent: false,
    serializer: null as null | Function,
    statusCode: 200,
  };

  const status = (code: number) => {
    if (STATUS_CODES[code] === undefined) {
      throw new ErrorFactory(
        'BAD_STATUS_CODE',
        'Called response with malformed status code'
      );
    }

    state.hasStatusCode = true;
    state.statusCode = code;
    return self;
  };

  const sendEnd = async (payload?: any) => {
    const statusCode = state.statusCode;

    if (payload === undefined || payload === null) {
      if (statusCode >= 200 && statusCode !== 204 && statusCode !== 304) {
        state.headers['content-length'] = '0';
      }
    }

    if (payload && typeof payload.pipe === 'function') {
      // TODO: Fleet Function doesn't support stream yet.
      throw new Error('Stream is not supported, convert to buffer.');
    }

    if (typeof payload !== 'string' && !Buffer.isBuffer(payload)) {
      throw new ErrorFactory(
        'INVALID_PAYLOAD_TYPE',
        `Attempted to send payload of invalid type ${typeof payload}. Expected a string or Buffer.`,
        500
      );
    }

    if (!state.headers['content-length']) {
      state.headers['content-length'] = '' + Buffer.byteLength(payload);
    }

    state.responseSent = true;

    if (state.preSend) {
      await state.preSend(payload);
    }

    res.writeHead(statusCode, state.headers);
    res.end(payload);

    return self;
  };

  const send = (payload?: any) => {
    if (state.responseSent) {
      return self;
    }

    if (payload instanceof Error) {
      onSendError(payload);
      return self;
    }

    if (payload === undefined) {
      sendEnd(payload);
      return self;
    }

    const contentType = getHeader('content-type');
    const hasContentType = contentType !== undefined;

    if (payload !== null) {
      if (Buffer.isBuffer(payload) || typeof payload.pipe === 'function') {
        if (hasContentType === false) {
          state.headers['content-type'] = CONTENT_TYPE.OCTET;
        }
        sendEnd(payload);
        return self;
      }

      if (hasContentType === false && typeof payload === 'string') {
        state.headers['content-type'] = CONTENT_TYPE.PLAIN;
        sendEnd(payload);
        return self;
      }
    }

    if (state.serializer !== null) {
      payload = state.serializer(payload);
    } else if (
      hasContentType === false ||
      contentType.indexOf('application/json') > -1
    ) {
      if (hasContentType === false || contentType.indexOf('charset') === -1) {
        state.headers['content-type'] = CONTENT_TYPE.JSON;
      }
      if (typeof payload !== 'string') {
        preserialize(payload);
        return self;
      }
    }

    sendEnd(payload);

    return self;
  };

  const preserialize = (payload: any) => {
    payload = JSON.stringify(payload);

    sendEnd(payload);
  };

  const onSendError = (error: any) => {
    let statusCode = state.statusCode >= 400 ? state.statusCode : 500;

    if (error != null) {
      if (error.headers !== undefined) {
        setHeaders(error.headers);
      }
      if (error.status >= 400) {
        statusCode = error.status;
      } else if (error.statusCode >= 400) {
        statusCode = error.statusCode;
      }
    }

    state.statusCode = statusCode;

    const payload = {
      error: STATUS_CODES[statusCode + ''],
      code: error.code,
      message: error.message || '',
      statusCode: statusCode,
    };

    state.headers['content-type'] = CONTENT_TYPE.JSON;

    sendEnd(payload);
  };

  const preSend = (preSend: PreSend) => {
    state.preSend = preSend;
    return self;
  };

  const getHeader = (key: string) => {
    return state.headers[key.toLowerCase()];
  };

  const hasHeader = (key: string) => {
    return state.headers[key.toLowerCase()] !== undefined;
  };

  const removeHeader = (key: string) => {
    delete state.headers[key.toLowerCase()];
    return self;
  };

  const setHeader = (key: string, value: any) => {
    const _key = key.toLowerCase();

    value = value === undefined ? '' : value;

    if (state.headers[_key] && _key === 'set-cookie') {
      if (typeof state.headers[_key] === 'string') {
        state.headers[_key] = [state.headers[_key]];
      }

      if (Array.isArray(value)) {
        Array.prototype.push.apply(state.headers[_key], value);
      } else {
        state.headers[_key].push(value);
      }
    } else {
      state.headers[_key] = value;
    }

    return self;
  };

  const setHeaders = (headers: Record<string, string>) => {
    const keys = Object.keys(headers);

    for (var i = 0; i < keys.length; i++) {
      setHeader(keys[i], headers[keys[i]]);
    }

    return self;
  };

  const serializer = (fn: Function) => {
    state.serializer = fn;
    return self;
  };

  const type = (type: string) => {
    state.headers['content-type'] = type;
    return self;
  };

  const redirect = (url: string, code: number) => {
    if (!code) {
      code = state.hasStatusCode ? state.statusCode : 302;
    }

    setHeader('location', url).code(code).send('');
  };

  const self = {
    code: status,
    getHeader,
    hasHeader,
    preSend,
    redirect,
    removeHeader,
    send,
    serializer,
    setHeader,
    status,
    type,
  };

  return self;
};
