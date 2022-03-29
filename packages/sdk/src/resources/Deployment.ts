/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {FleetResource} from '../FleetResource';
import type {Stage} from '../types';
import type {Environment} from '../objects/Environment';

type WorkloadResult = {
  id: string;
  object: 'function';
  name: string;
  ready_state: string;
  metadata: {
    asynchronous: number;
    filename: string;
    sha: string;
    size: number;
    timeout: number;
  };
  http: {
    method: Array<string>;
    path: string;
  };
  created: string;
  updated: string;
};

type Collection<T> = {
  data: Array<T>;
  object: 'list';
};

type CreateDeploymentResult = {
  id: string;
  uid: string;
  object: 'deployment';
  creator: {
    id: string;
    type: 'User';
    object: 'user';
    email: string;
    name: string;
    created: string;
    updated: string;
  };
  stage: 'PREVIEW' | 'PRODUCTION';
  ready_state: string;
  regions: Array<string>;
  domain: {
    id: string;
    object: 'domain';
    name: string;
    primary: boolean;
    created: string;
    updated: string;
  };
  project: {
    id: string;
    object: 'project';
    name: string;
    user_id: string;
    subdomain: string;
    created: string;
    updated: string;
  };
  functions: Collection<WorkloadResult>;
  created: string;
  updated: string;
};

type CommitDeploymentResult = {
  id: string;
  object: 'deployment';
  promote: boolean;
  url: string;
  stage: Stage;
};

type FilesDeploymentResult = string;

export class Deployment extends FleetResource {
  path = 'deployments';

  create(payload: Environment): Promise<CreateDeploymentResult> {
    return this.createMethod({
      object: 'create',
      path: '',
      payload,
    });
  }

  deploy(payload: Environment): Promise<Array<FilesDeploymentResult>> {
    return this.createMethod({
      headers: {'Content-Type': 'application/octet-stream'},
      json: false,
      object: 'deploy',
      path: 'files',
      payload,
    });
  }

  commit(payload: Environment): Promise<CommitDeploymentResult> {
    return this.createMethod({
      object: 'commit',
      path: 'commit',
      payload,
    });
  }
}
