import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { map, Observable } from "rxjs";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import { ConfigService } from "../../config.service";
import { SessionStorageService } from "../../common";

@Component({
  selector: 'mcma-login',
  templateUrl: './login.component.html',
  styleUrls: [ './login.component.scss' ]
})
export class LoginComponent implements OnInit {
  faGithub = faGithub;

  callbackId$: Observable<string | null>;

  constructor(private route: ActivatedRoute, private configService: ConfigService, private sessionStorageService: SessionStorageService) {
    this.callbackId$ = this.route.queryParams.pipe(map(p => p[SessionStorageService.authCallbackIdKey]));
  }

  ngOnInit(): void {
    this.callbackId$.subscribe(callbackId => {
      if (callbackId) {
        this.sessionStorageService.authCallbackId = callbackId;
        this.loginWithGitHub();
      } else {
        this.sessionStorageService.authCallbackId = null;
      }
    });
  }

  loginWithGitHub(): void {
    window.location.href = this.configService.authUrl;
  }
}
