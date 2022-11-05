// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Config } from "../app/config";

export const environment: { defaultConfig: Config, production: boolean } = {
  defaultConfig: {
    region: "us-east-1",
    environment: "dev",
    clientId: "52stnrvpeb0b3d0176ilv4e17u",
    redirectUrl: "http://localhost:4200/auth-callback",
    authResponseType: "code"
  },
  production: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
