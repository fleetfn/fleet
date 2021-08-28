/**
 * Copyright (c) 2021-present Fleet FN, Inc. All rights reserved.
 */

export class Action<T> {
  data: T | null = null;
  session: any = {};

  get params() {
    return '';
  }
}
