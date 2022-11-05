import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, catchError, combineLatest, map, Observable, of } from "rxjs";
import { faCircleExclamation, faCircleCheck } from "@fortawesome/free-solid-svg-icons"

import { SessionStorageService, UserService } from "../../common";
import { ConfigService } from "../../config.service";

type Tokens = { accessToken: string, idToken: string, refreshToken?: string };

function getTokensFromFragment(fragment: string | null): Tokens {
  let accessToken = "";
  let idToken = "";

  if (!fragment || fragment.length < 20) {
    return { accessToken, idToken };
  }

  try {
    const hashParams = new URLSearchParams(fragment);
    accessToken = hashParams.get("access_token") ?? "";
    idToken = hashParams.get("id_token") ?? "";
  } catch (e) {
    console.log(e);
  }
  return { accessToken, idToken };
}

@Component({
  selector: 'mcma-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: [ './auth-callback.component.scss' ]
})
export class AuthCallbackComponent implements OnInit {
  private noTokensSource = new BehaviorSubject<boolean>(false);
  private isSendingSource = new BehaviorSubject<boolean>(false);
  private isCompletedSource = new BehaviorSubject<boolean>(false);
  private isFailedSource = new BehaviorSubject<boolean>(false);

  faCircleCheck = faCircleCheck;
  faCircleExclamation = faCircleExclamation;

  noTokens$ = this.noTokensSource.asObservable();
  isSending$ = this.isSendingSource.asObservable();
  isCompleted$ = this.isCompletedSource.asObservable();
  isFailed$ = this.isFailedSource.asObservable();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private sessionStorageService: SessionStorageService,
    private userService: UserService,
    private configService: ConfigService
  ) {
    this.noTokens$.subscribe(x => {
      if (x) {
        setTimeout(() => this.router.navigate([ '/' ]), 3000);
      }
    })
  }

  private getTokensFromCode$(code: string): Observable<Tokens> {
    const params = new URLSearchParams();
    params.set("client_id", this.configService.clientId);
    params.set("redirect_uri", this.configService.redirectUrl);
    params.set("grant_type", "authorization_code");
    params.set("code", code);

    const headers = { ["Content-Type"]: "application/x-www-form-urlencoded" };

    type TokenResponse = { access_token: string, id_token: string, refresh_token: string };

    return this.httpClient.post<TokenResponse>(this.configService.tokenUrl, params.toString(), { headers })
      .pipe(
        map(x => ({ accessToken: x.access_token, idToken: x.id_token, refreshToken: x.refresh_token }))
      );
  }

  private sendTokensToCli(callbackId: string, tokens: Tokens): void {
    this.sessionStorageService.authCallbackId = null;
    this.isSendingSource.next(true);
    this.httpClient.post(`https://modules.mcma.io/auth-callback/${callbackId}`, tokens, { observe: "response", responseType: "text" })
      .pipe(
        catchError(error => {
          this.isSendingSource.next(false);
          this.isFailedSource.next(true);
          throw error;
        })
      ).subscribe(() => {
      this.isSendingSource.next(false);
      this.isCompletedSource.next(true);
    });
  }

  ngOnInit(): void {
    combineLatest([
      this.route.queryParams.pipe(map(q => q["code"])),
      this.route.fragment.pipe(map(f => getTokensFromFragment(f)))
    ]).subscribe(([ code, tokens ]) => {
      let tokens$: Observable<Tokens> | null = null;
      if (code) {
        tokens$ = this.getTokensFromCode$(code);
      } else if (tokens) {
        tokens$ = of(tokens);
      }

      if (tokens$) {
        tokens$.subscribe(tokens => {
          const callbackId = this.sessionStorageService.authCallbackId;
          if (callbackId) {
            this.sendTokensToCli(callbackId, tokens);
          } else {
            this.isCompletedSource.next(true);
            this.userService.setIdToken(tokens.idToken);
            const callbackRoute = this.sessionStorageService.authCallbackRoute ?? "/";
            this.router.navigate([ callbackRoute ]);
          }
        });
      } else {
        this.noTokensSource.next(true);
      }
    });
  }

}
