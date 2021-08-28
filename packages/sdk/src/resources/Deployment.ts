/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {FleetResource} from '../FleetResource';
import type {Environment} from '../objects/Environment';

export class Deployment extends FleetResource {
  path = 'function/deployments';

  create(payload: Environment) {
    return this.createMethod({
      object: 'create',
      path: 'create',
      payload,
    });
  }

  deploy(payload: Environment) {
    return this.createMethod({
      headers: {'Content-Type': 'application/octet-stream'},
      json: false,
      object: 'deploy',
      path: 'files',
      payload,
    });
  }

  commit(payload: Environment) {
    return this.createMethod({
      object: 'commit',
      path: 'finish',
      payload,
    });
  }
}
