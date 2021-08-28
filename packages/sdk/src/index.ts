/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import type {RequestInit, BodyInit} from 'node-fetch';

import fetch from './fetch';
import {Deployment} from './resources/Deployment';
import {Project} from './resources/Project';

export type FleeProps = {
  token: string;
  url?: string;
};

export class Fleet {
  token: string;
  url: string;
  deployment: Deployment;
  project: Project;

  constructor({token, url = 'https://api.runfleet.io/v1/api/'}: FleeProps) {
    this.token = token;
    this.url = url;

    this.deployment = new Deployment(this.request.bind(this));
    this.project = new Project(this.request.bind(this));
  }

  request(uri: string, body: BodyInit, opts: RequestInit = {}) {
    return fetch({
      ...opts,
      apiUrl: this.url + uri,
      body,
      token: this.token,
    });
  }
}

export * as Objects from './objects';
