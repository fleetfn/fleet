import fs from 'fs';

import {Action} from './Action';

export class File extends Action {
  constructor({path, handler, id}) {
    super();

    this.data = fs.createReadStream(path);
    this.handler = handler;
    this.id = id;
  }

  get params() {
    const {handler, id} = this;

    return `?handler=${handler}&functionId=${id}`;
  }
}
