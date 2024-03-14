import { S3Client } from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";
import { getSearchClient } from "@local/common";

import { getRoutes } from "./routes/index.js";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";

const s3Client = new S3Client({});

const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-api-handler", process.env.LogGroupName);
const dynamoDbTableProvider = new DynamoDbTableProvider();

const searchClient = await getSearchClient(loggerProvider);
const routes = getRoutes(searchClient, s3Client, dynamoDbTableProvider);
const restController = new ApiGatewayApiController(routes, loggerProvider);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const logger = loggerProvider.get(context.awsRequestId);
    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        const eventWithPath = Object.assign({}, event, { path: "/" + event.pathParameters.proxy });
        logger.debug(eventWithPath);

        return await restController.handleRequest(eventWithPath, context);
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush(Date.now() + context.getRemainingTimeInMillis() - 5000);
    }
}