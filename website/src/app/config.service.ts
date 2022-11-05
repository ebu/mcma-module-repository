import { APP_INITIALIZER, Injectable, Provider } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, of } from "rxjs";

export interface Config {
  region: string;
  environment: string;
  clientId: string;
  redirectUrl: string;
}

@Injectable()
export class ConfigService implements Config {
  private config: Config | null = null;

  constructor(private httpClient: HttpClient) {
  }

  get region(): string {
    return this.config?.region ?? "us-east-1";
  }

  get environment(): string {
    return this.config?.environment ?? "dev";
  }

  get clientId(): string {
    return this.config?.clientId ?? "52stnrvpeb0b3d0176ilv4e17u";
  }

  get redirectUrl(): string {
    return this.config?.redirectUrl ?? "https://modules.mcma.io/auth-callback";
  }

  get authUrl(): string {
    return `https://auth-${this.region}-${this.environment}.mcma.io/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUrl}&response_type=token&identity_provider=GitHub&scope=openid%20profile%20email`;
  }

  initialize(): Observable<any> {
    return this.httpClient.get<Config>("config.json")
      .pipe(
        catchError(() => of(null)),
        map(x => this.config = x));
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
