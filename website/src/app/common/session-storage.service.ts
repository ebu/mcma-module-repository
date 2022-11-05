import { Injectable } from "@angular/core";
import { IdToken } from "./user.service";

@Injectable()
export class SessionStorageService {
  public static readonly authCallbackIdKey = "authCallbackId";
  public static readonly authCallbackRouteKey = "authCallbackRoute";
  public static readonly idTokenKey = "idToken";

  private setOrRemove(key: string, val: string | null): void {
    if (val) {
      sessionStorage.setItem(key, val);
    } else {
      sessionStorage.removeItem(key);
    }
  }

  get authCallbackId(): string | null {
    return sessionStorage.getItem(SessionStorageService.authCallbackIdKey);
  }

  set authCallbackId(val: string | null) {
    this.setOrRemove(SessionStorageService.authCallbackIdKey, val);
  }

  get authCallbackRoute(): string | null {
    return sessionStorage.getItem(SessionStorageService.authCallbackRouteKey);
  }

  set authCallbackRoute(val: string | null) {
    this.setOrRemove(SessionStorageService.authCallbackRouteKey, val);
  }

  get idToken(): IdToken | null {
    const idTokenJson = sessionStorage.getItem(SessionStorageService.idTokenKey);
    return !!idTokenJson ? JSON.parse(idTokenJson) : null;
  }

  set idToken(val: IdToken | null) {
    this.setOrRemove(SessionStorageService.idTokenKey, JSON.stringify(val));
  }
}
