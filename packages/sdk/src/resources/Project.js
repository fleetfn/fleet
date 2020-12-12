import {FleetResource} from '../FleetResource';

export class Project extends FleetResource {
  path = 'project';

  project(projectId) {
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
