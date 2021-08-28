/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import type {RequestInit, BodyInit} from 'node-fetch';

import {Action} from './objects/Action';

type Client = (uri: string, body: BodyInit, opts?: RequestInit) => Promise<any>;

type Method<T> = RequestInit & {
  json?: boolean;
  object?: string;
  path: string;
  payload?: T;
  variables?: Record<string, string>;
};

export class FleetResource {
  client: Client;
  path: string;

  constructor(client: Client) {
    this.client = client;
    this.path = '';
  }

  async createMethod<T extends Action<any>>({
    object,
    path,
    variables,
    payload,
    ...options
  }: Method<T>) {
    let body: any = payload;

    if (payload instanceof Action && object) {
      // @ts-ignore
      body = payload[object]();
    }

    if (Array.isArray(body)) {
      return Promise.all(
        body.map((action) =>
          this.client(
            `${this.path}/${path}${action.params}`,
            action.data,
            options
          )
        )
      );
    } else {
      return this.client(
        `${this.path}/${path}${this.getVariables(variables)}`,
        body,
        options
      ).then((res) => {
        if (payload instanceof Action && object) {
          payload.session[object] = res;
        }

        return res;
      });
    }
  }

  getVariables(variables?: Record<string, string>) {
    if (!variables) {
      return '';
    }

    // @ts-ignore
    return `?${new URLSearchParams(variables)}`;
  }
}
