"use strict";

import { AxiosResponse } from "axios";

interface ResponseStoreItem {
  resp: AxiosResponse;
  data?: any;
}

export class ResponseStore {
  private static cache: Map<string, ResponseStoreItem> = new Map<
    string,
    ResponseStoreItem
  >();
  private static lastResponseUri: string = "";

  public static get size(): number {
    return ResponseStore.cache.size;
  }

  public static add(uri: string, response: ResponseStoreItem) {
    ResponseStore.cache.set(uri, response);
    ResponseStore.lastResponseUri = uri;
  }

  public static get(uri: string): ResponseStoreItem | undefined {
    return ResponseStore.cache.get(uri);
  }

  public static remove(uri: string) {
    ResponseStore.cache.delete(uri);
  }

  public static getLatestResponse(): ResponseStoreItem | undefined {
    return ResponseStore.get(ResponseStore.lastResponseUri);
  }
}
