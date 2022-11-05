import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, catchError, map } from "rxjs";
import { faCircleExclamation, faCircleCheck } from "@fortawesome/free-solid-svg-icons"

import { SessionStorageService, UserService } from "../../common";

type Tokens = { accessToken: string, idToken: string };

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

  constructor(private router: Router, private route: ActivatedRoute, private httpClient: HttpClient, private sessionStorageService: SessionStorageService, private userService: UserService) {
    this.noTokens$.subscribe(x => {
      if (x) {
        setTimeout(() => this.router.navigate([ '/' ]), 3000);
      }
    })
  }

  ngOnInit(): void {
    this.route.fragment.pipe(map(f => getTokensFromFragment(f)))
      .subscribe(tokens => {
        if (tokens?.accessToken) {
          const callbackId = this.sessionStorageService.authCallbackId;
          if (callbackId) {
            this.sessionStorageService.authCallbackId = null;
            this.isSendingSource.next(true);
            this.httpClient.post(`https://modules.mcma.io/auth-callback/${callbackId}`, tokens, { observe: "response", responseType: "text" })
              .pipe(catchError(error => {
                this.isSendingSource.next(false);
                this.isFailedSource.next(true);
                throw error;
              }))
              .subscribe(() => {
                this.isSendingSource.next(false);
                this.isCompletedSource.next(true);
              })
          } else {
            this.isCompletedSource.next(true);
            this.userService.setIdToken(tokens.idToken);
            const callbackRoute = this.sessionStorageService.authCallbackRoute ?? "/";
            this.router.navigate([ callbackRoute ]);
          }
        } else {
          this.noTokensSource.next(true);
        }
      });
  }

}
