import fetch from './fetch';
import {Deployment} from './resources/Deployment';
import {Project} from './resources/Project';

export class Fleet {
  constructor({apiKey, url = 'https://api.runfleet.io/v1/api/'}) {
    this.apiKey = apiKey;
    this.url = url;

    this.deployment = new Deployment(this.request);
    this.project = new Project(this.request);
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
