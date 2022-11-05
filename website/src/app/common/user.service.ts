import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import jwt_decode from "jwt-decode";
import { SessionStorageService } from "./session-storage.service";

export type IdToken = {
  sub: string,
  picture: string | undefined,
  profile: string | undefined,
  preferred_username: string | undefined,
  name: string | undefined,
  email: string | undefined
};

@Injectable()
export class UserService {
  private idTokenSource = new BehaviorSubject<IdToken | null>(null);

  idToken$ = this.idTokenSource.asObservable();

  constructor(private sessionStorageService: SessionStorageService) {
    if (this.sessionStorageService.idToken) {
      this.idTokenSource.next(this.sessionStorageService.idToken);
    }
  }


  setIdToken(idTokenEncoded: string): void {
    let idToken: IdToken;
    try {
      idToken = jwt_decode(idTokenEncoded);
      this.sessionStorageService.idToken = idToken;
      this.idTokenSource.next(idToken);
    } catch (e) {
      console.error(e);
    }
  }
}
