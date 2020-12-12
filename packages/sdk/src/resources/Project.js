import {FleetResource} from '../FleetResource';

export class Project extends FleetResource {
  path = 'project';

  project(projectId) {
    return {
      json: false,
      method: 'GET',
      path: '',
      variables: {
        projectId,
      },
    };
  }

  all() {
    return {
      json: false,
      method: 'GET',
      path: 'all',
    };
  }
}
