import {Action} from '../objects/Action';

export class FleetResource {
  constructor(client) {
    this.path = '';
    this.client = client;

    this.createMethods();
  }

  createMethods() {
    const {path, ...methods} = this;

    Object.keys(methods).map((methodName) => {
      if (typeof this[methodName] !== 'function') {
        return;
      }

      this[methodName] = (payload = null) => {
        const {path: methodPath, variables, ...options} = this[methodName](
          payload
        );

        const body = payload instanceof Action ? payload[methodName]() : null;

        if (Array.isArray(body)) {
          return Promise.all(
            body.map((Obj) =>
              this.client(
                `${path}/${methodPath}${Obj.params}`,
                Obj.data,
                options
              )
            )
          );
        } else {
          return this.client(
            `${path}/${methodPath}${this.getVariables(variables)}`,
            body,
            options
          ).then((res) => {
            payload.session[methodName] = res;

            return res;
          });
        }
      };
    });
  }

  getVariables(variables) {
    if (!variables) {
      return '';
    }

    return `?${new URLSearchParams(variables)}`;
  }
}
