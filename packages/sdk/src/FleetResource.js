import {Action} from './objects/Action';

export class FleetResource {
  constructor(client) {
    this.client = client;
  }

  createMethod({object, path, variables, payload, ...options}) {
    const body =
      payload instanceof Action && object ? payload[object]() : payload;

    if (Array.isArray(body)) {
      return Promise.all(
        body.map((action) =>
          this.client(
            `${this.path}/${path}${action.params}`,
            action.data,
            options
          )
        )
      );
    } else {
      return this.client(
        `${this.path}/${path}${this.getVariables(variables)}`,
        body,
        options
      ).then((res) => {
        if (payload instanceof Action && object) {
          payload.session[object] = res;
        }

        return res;
      });
    }
  }

  getVariables(variables) {
    if (!variables) {
      return '';
    }

    return `?${new URLSearchParams(variables)}`;
  }
}
