/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

export enum Stage {
  PRODUCTION = 'PRODUCTION',
  PREVIEW = 'PREVIEW',
}

export type APIError = {
  code: number;
  message: string;
  type: string;
};

export type WorkfuncHttp = {
  method: Array<
    'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'DELETE'
  >;
  path: string;
};

export type WorkfuncMetadata = {
  asynchronous: number;
  filename: string;
  sha: string;
  size: number;
  timeout: number;
};

export type Workfunc = {
  http: WorkfuncHttp;
  metadata: WorkfuncMetadata;
  name: string;
};
