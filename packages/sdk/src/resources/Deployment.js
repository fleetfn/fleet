import {FleetResource} from '../FleetResource';

export class Deployment extends FleetResource {
  path = 'function/deployments';

  create(payload) {
    return this.createMethod({
      object: 'create',
      path: 'create',
      payload,
    });
  }

  deploy(payload) {
    return this.createMethod({
      headers: {'Content-Type': 'application/octet-stream'},
      json: false,
      object: 'deploy',
      path: 'files',
      payload,
    });
  }

  commit(payload) {
    return this.createMethod({
      object: 'commit',
      path: 'finish',
      payload,
    });
  }
}
