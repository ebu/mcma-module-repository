export interface Config {
  region: string;
  environment: string;
  clientId: string;
  redirectUrl: string;
  authResponseType: "code" | "token";
}
