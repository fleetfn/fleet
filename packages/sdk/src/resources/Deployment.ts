/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {FleetResource} from '../FleetResource';
import type {Stage} from '../types';
import type {Environment} from '../objects/Environment';

type WorkloadResult = {
  filename: string;
  id: string;
  name: string;
};

type CreateDeploymentResult = {
  id: string;
  uid: string;
  object: 'deployment';
  owner_id: string;
  regions: Array<string>;
  ready_state: string;
  url: string;
  last_deployment_deleted: boolean;
  functions: Array<WorkloadResult>;
  created: Date;
  updated: Date;
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
