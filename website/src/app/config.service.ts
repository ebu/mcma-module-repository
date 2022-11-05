import { APP_INITIALIZER, Injectable, Provider } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, of } from "rxjs";

import { Config } from "./config";
import { environment } from "../environments/environment";

@Injectable()
export class ConfigService implements Config {
  private config: Config = Object.assign({}, environment.defaultConfig);

  constructor(private httpClient: HttpClient) {
  }

  get region(): string {
    return this.config?.region;
  }

  get environment(): string {
    return this.config.environment;
  }

  get clientId(): string {
    return this.config.clientId;
  }

  get redirectUrl(): string {
    return this.config.redirectUrl;
  }

  get authResponseType(): "code" | "token" {
    return this.config.authResponseType;
  }

  get authUrl(): string {
    return `https://auth-${this.region}-${this.environment}.mcma.io/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUrl}&response_type=${this.authResponseType}&identity_provider=GitHub&scope=openid%20profile%20email`;
  }

  get tokenUrl(): string {
    return `https://auth-${this.region}-${this.environment}.mcma.io/token`;
  }

  initialize(): Observable<any> {
    return this.httpClient.get<Config>("config.json")
      .pipe(
        catchError(() => of({})),
        map(x => Object.assign(this.config, x))
      );
  }
}

export const ConfigInitializer: Provider = {
  provide: APP_INITIALIZER,
  useFactory: function initializeConfig(configService: ConfigService): () => Observable<any> {
    return () => configService.initialize();
  },
  deps: [ ConfigService ],
  multi: true
};
