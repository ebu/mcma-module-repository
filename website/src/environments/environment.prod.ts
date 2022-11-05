import { Config } from "../app/config";

export const environment: { defaultConfig: Config, production: boolean } = {
  defaultConfig: {
    region: "us-east-1",
    environment: "dev",
    clientId: "52stnrvpeb0b3d0176ilv4e17u",
    redirectUrl: "https://modules.mcma.io/auth-callback",
    authResponseType: "code"
  },
  production: true
};
