/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {FleetResource} from '../FleetResource';

type ProjectResult = {
  id: string;
  object: 'project';
  owner_id: string;
  name: string;
  subdomain: string;
  created: Date;
  updated: Date;
};

type ListProject = {
  id: string;
  created_at: Date;
  name: string;
  subdomain: string;
  updated_at: string;
  user_id: string;
};

type ProjectsResult = {
  object: 'list';
  data: Array<ListProject>;
};

export class Project extends FleetResource {
  path = 'project';

  project(project_id: string): Promise<ProjectResult> {
    return this.createMethod({
      json: false,
      method: 'GET',
      path: project_id,
    });
  }

  all(): Promise<ProjectsResult> {
    return this.createMethod({
      json: false,
      method: 'GET',
      path: '',
    });
  }
}
