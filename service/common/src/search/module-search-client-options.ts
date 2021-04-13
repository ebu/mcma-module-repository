import { Authenticator, HttpClientConfig } from "@mcma/client";
import { Logger } from "@mcma/core";

export interface ModuleSearchClientOptions {
    endpoint: string;
    latestVersionsIndex: string;
    previousVersionsIndex: string;
    authenticator?: Authenticator;
    httpClientConfig?: HttpClientConfig;
    logger?: Logger;
}