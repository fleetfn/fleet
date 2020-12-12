import {FleetResource} from '../FleetResource';

export class Deployment extends FleetResource {
  path = 'function/deployments';

  create() {
    return {
      path: 'create',
    };
  }

  deploy() {
    return {
      headers: {'Content-Type': 'application/octet-stream'},
      json: false,
      path: 'files',
    };
  }

  commit() {
    return {
      path: 'finish',
    };
  }
}
