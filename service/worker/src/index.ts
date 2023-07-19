import { Context } from "aws-lambda";
import { AuthProvider, ResourceManagerProvider } from "@mcma/client";
import { ProviderCollection, Worker, WorkerRequest, WorkerRequestProperties } from "@mcma/worker";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { awsV4Auth } from "@mcma/aws-client";
import { getSearchClient } from "@local/common";

import { createPublishModuleHandler } from "./publish-module-operation.js";
import { createIndexModuleHandler } from "./index-module-operation.js";

const authProvider = new AuthProvider().add(awsV4Auth());
const dbTableProvider = new DynamoDbTableProvider();
const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-worker", process.env.LogGroupName);
const resourceManagerProvider = new ResourceManagerProvider(authProvider);

const providerCollection = new ProviderCollection({
    authProvider,
    dbTableProvider,
    loggerProvider,
    resourceManagerProvider
});

const searchClient = await getSearchClient(loggerProvider);

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