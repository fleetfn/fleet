/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {FleetResource} from '../FleetResource';

export class Project extends FleetResource {
  path = 'project';

  project(projectId: string) {
    return this.createMethod({
      json: false,
      method: 'GET',
      path: '',
      variables: {
        projectId,
      },
    });
  }

  all() {
    return this.createMethod({
      json: false,
      method: 'GET',
      path: 'all',
    });
  }
}
