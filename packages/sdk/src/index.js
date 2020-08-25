import fetch from './fetch';
import {registerDeploy} from './models/deploy';
import {registerProject} from './models/project';

export class Fleet {
  constructor({apiKey, url = 'https://api.runfleet.io/v1/api/'}) {
    this.apiKey = apiKey;
    this.url = url;

    this.deploy = registerDeploy(this);
    this.project = registerProject(this);
  }

  request(uri, body, opts = {}) {
    return fetch({
      ...opts,
      apiUrl: this.url + uri,
      body,
      token: this.apiKey,
    });
  }
}
