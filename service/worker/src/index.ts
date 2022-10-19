import * as AWS from "aws-sdk";
import { Context } from "aws-lambda";
import { AuthProvider, ResourceManagerProvider } from "@mcma/client";
import { ProviderCollection, Worker, WorkerRequest, WorkerRequestProperties } from "@mcma/worker";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { awsV4Auth, AwsV4Authenticator } from "@mcma/aws-client";
import { ModuleSearchClient } from "@local/common";

import { createPublishModuleHandler } from "./publish-module-operation";
import { createIndexModuleHandler } from "./index-module-operation";

const {
    ElasticEndpoint,
    LatestVersionsElasticIndex,
    PreviousVersionsElasticIndex
} = process.env;


const authProvider = new AuthProvider().add(awsV4Auth(AWS));
const dbTableProvider = new DynamoDbTableProvider();
const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-worker", process.env.LogGroupName);
const resourceManagerProvider = new ResourceManagerProvider(authProvider);

const providerCollection = new ProviderCollection({
    authProvider,
    dbTableProvider,
    loggerProvider,
    resourceManagerProvider
});

const elasticAuthContext = {
    accessKey: AWS.config.credentials.accessKeyId,
    secretKey: AWS.config.credentials.secretAccessKey,
    sessionToken: AWS.config.credentials.sessionToken,
    region: AWS.config.region,
    serviceName: "es"
};

const searchClient = new ModuleSearchClient({
    endpoint: ElasticEndpoint,
    latestVersionsIndex: LatestVersionsElasticIndex,
    previousVersionsIndex: PreviousVersionsElasticIndex,
    authenticator: new AwsV4Authenticator(elasticAuthContext),
    logger: loggerProvider.get()
});

const worker =
    new Worker(providerCollection)
        .addOperation("publishModule", createPublishModuleHandler())
        .addOperation("indexModule", createIndexModuleHandler(searchClient));

export async function handler(event: WorkerRequestProperties, context: Context) {
    const logger = loggerProvider.get(context.awsRequestId, event.tracker);

    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        await worker.doWork(new WorkerRequest(event, logger));
    } catch (error) {
        logger.error("Error occurred when handling operation '" + event.operationName + "'");
        logger.error(error.toString());
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush();
    }
}