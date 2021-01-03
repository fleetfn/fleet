type GenericObject = {[k: string]: any};

export interface FleetRequest<T = any, K = GenericObject> {
  /**
   * The body
   */
  body: T;

  /**
   * The function name that was defined in the fleet.yml manifest
   */
  functionName: string;

  /**
   * Uid of the function
   */
  functionUid: string;

  /**
   * The request headers object
   * - Key-value pairs of header names and values. Header names are lower-cased.
   */
  headers: {[k: string]: any};

  /**
   * Hostname of the incoming request
   */
  hostname: string;

  /**
   * Method of the incoming request
   * - GET
   * - POST
   * - PUT
   * - PATCH
   * - HEAD
   * - OPTIONS
   * - DELETE
   */
  method: string;

  /**
   * Parsed querystring
   */
  query: K;

  /**
   * This contains only the URL that is present in the actual HTTP request.
   */
  url: string;
}

export interface FleetResponse {
  /**
   * Sets the status code. By default it is 200.
   */
  code: (code: number) => FleetResponse;

  /**
   * Retrieves the header defined before.
   */
  getHeader: (key: string) => string;

  /**
   * Check if a header has been set.
   */
  hasHeader: (key: string) => boolean;

  /**
   * Redirect to the specified URL, code is optional (Default value 302).
   */
  redirect: (url: string, code: number) => void;

  /**
   * Remove the value of a previously set header.
   */
  removeHeader: (key: string) => FleetResponse;

  /**
   * Sends the payload to the user, it can be plain text, a buffer, JSON or an Error object.
   */
  send: (payload?: any) => void;

  /**
   * Sets a custom serializer for the payload.
   */
  serializer: (fn: Function) => FleetResponse;

  /**
   * Sets a response header.
   */
  setHeader: (key: string, value: any) => FleetResponse;

  /**
   * Sets the header Content-Type.
   */
  type: (type: string) => FleetResponse;
}
