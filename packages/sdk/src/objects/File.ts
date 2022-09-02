/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import fs, {ReadStream} from 'fs';

import {Action} from './Action';

type FileProps = {
  path: string;
  handler: string;
  id: string;
};

export class File extends Action<ReadStream> {
  handler: string;
  id: string;

  constructor({path, handler, id}: FileProps) {
    super();

    this.data = fs.createReadStream(path);
    this.handler = handler;
    this.id = id;
  }

  get params() {
    return `/${this.id}`;
  }
}
