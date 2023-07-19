import { fromEnv } from "@aws-sdk/credential-providers";
import { AwsV4Authenticator } from "@mcma/aws-client";
import { LoggerProvider } from "@mcma/core";

import { ModuleSearchClient } from "./module-search-client.js";

const {
    ElasticEndpoint,
    LatestVersionsElasticIndex,
    PreviousVersionsElasticIndex
} = process.env;

export async function getSearchClient(loggerProvider: LoggerProvider): Promise<ModuleSearchClient> {
    const credsProvider = fromEnv();
    const creds = await credsProvider();
    
    const elasticAuthContext = {
        accessKey: creds.accessKeyId,
        secretKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
        region: process.env.AWS_REGION,
        serviceName: "es"
    };
    
    return new ModuleSearchClient({
        endpoint: ElasticEndpoint,
        latestVersionsIndex: LatestVersionsElasticIndex,
        previousVersionsIndex: PreviousVersionsElasticIndex,
        authenticator: new AwsV4Authenticator(elasticAuthContext),
        logger: loggerProvider.get()
    });
}