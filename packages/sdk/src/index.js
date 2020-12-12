import fetch from './fetch';
import {registerProject} from './models/project';
import {Deployment} from './resources/Deployment';

export class Fleet {
  constructor({apiKey, url = 'https://api.runfleet.io/v1/api/'}) {
    this.apiKey = apiKey;
    this.url = url;

    this.project = registerProject(this);
    this.deployment = new Deployment(this.request);
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
