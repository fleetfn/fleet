/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

import type {Manifest} from './manifest';

export enum Actions {
  ADD_MANIFEST = 0,
  ADD_COMPILED_DIR = 1,
}

export interface ActionAddManifest extends Action {
  payload: Manifest;
  type: Actions.ADD_MANIFEST;
}

interface Action {
  payload: any;
  type: Actions;
}

type Store = {
  compiledFunctionsDir: string;
  manifest: Manifest;
};

let store = {} as Store;

const reducer = <S extends Action>(state: Store, action: S) => {
  switch (action.type) {
    case Actions.ADD_MANIFEST:
      return {
        ...state,
        manifest: action.payload,
      };
    case Actions.ADD_COMPILED_DIR:
      return {
        ...state,
        compiledFunctionsDir: action.payload,
      };
    default:
      return state;
  }
};

const dispatch = <S extends Action>(action: S): void => {
  store = reducer<S>(store, action);
};

export default {
  getState: () => store,
  dispatch,
};
