import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { AwsV4Authenticator } from "@mcma/aws-client";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";
import { ModuleSearchClient } from "@local/common";

import { getRoutes } from "./routes";

const s3 = new AWS.S3();
const {
    ElasticEndpoint,
    LatestVersionsElasticIndex,
    PreviousVersionsElasticIndex
} = process.env;

const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-api-handler", process.env.LogGroupName);

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

const restController = new ApiGatewayApiController(getRoutes(searchClient, s3), loggerProvider);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const logger = loggerProvider.get(context.awsRequestId);
    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        return await restController.handleRequest(event, context);
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush(Date.now() + context.getRemainingTimeInMillis() - 5000);
    }
}