import {Action} from './Action';

export class Environment extends Action {
  constructor({
    commit_head,
    environment_variables,
    project_id,
    regions,
    resources,
    stage,
  }) {
    super();

    this.files = [];
    this.commit_head = commit_head;
    this.environment_variables = environment_variables;
    this.project_id = project_id;
    this.regions = regions;
    this.resources = resources;
    this.stage = stage;
  }

  create() {
    const {commit_head, project_id, regions, resources, stage} = this;

    return {
      // Normalizes the handler extensions, once the build is done locally
      // we need to normalize to `.js` when file is ts.
      functions: resources.map((func) => {
        const newFunc = {...func};

        /// Only add the latest git commit if the repo supports git
        if (commit_head) {
          newFunc.gitCommitLatest = commit_head;
        }

        const handler = func.handler.startsWith('./')
          ? func.handler
          : `./${func.handler}`;

        return {
          ...newFunc,
          handler: handler.replace('.ts', '.js'),
        };
      }),
      prod: stage === 'prod',
      projectId: project_id,
      regions,
    };
  }

  deploy() {
    return this.files;
  }

  commit() {
    const {environment_variables, project_id, regions, stage, session} = this;

    return {
      deployUid: session.create.deployUid,
      env: environment_variables,
      prod: stage === 'prod',
      projectId: project_id,
      regions,
    };
  }
}
