/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import {Action} from './Action';
import type {Workfunc, Stage} from '../types';

type CommitHead = {
  date: string;
  hash: string;
  message: string;
  refs: string;
};

type Metadata = {
  git_commit_latest?: CommitHead;
};

type EnvironmentProps = {
  env?: Record<string, string>;
  metadata: Metadata;
  project_id: string;
  regions: Array<string>;
  stage: Stage;
  functions: Array<Workfunc>;
};

export class Environment extends Action<unknown> {
  env?: Record<string, string>;
  files: Array<any>;
  functions: Array<Workfunc>;
  metadata: Metadata;
  project_id: string;
  regions: Array<string>;
  stage: Stage;

  constructor({
    env,
    functions,
    metadata,
    project_id,
    regions,
    stage,
  }: EnvironmentProps) {
    super();

    this.files = [];
    this.metadata = metadata;
    this.env = env;
    this.project_id = project_id;
    this.regions = regions;
    this.functions = functions;
    this.stage = stage;
  }

  create() {
    const {env, metadata, project_id, regions, functions} = this;

    return {
      // Normalizes the handler extensions, once the build is done locally
      // we need to normalize to `.js` when file is ts.
      functions: functions.map((data) => {
        const filename = data.metadata.filename.startsWith('./')
          ? data.metadata.filename
          : `./${data.metadata.filename}`;

        const metadata = {
          ...data.metadata,
          filename: filename.replace('.ts', '.js'),
        };

        return {
          ...data,
          metadata,
        };
      }),
      env,
      metadata,
      project_id,
      regions,
    };
  }

  deploy() {
    return this.files;
  }

  commit() {
    const {session, stage} = this;

    return {
      id: session.create.id,
      stage,
    };
  }
}
