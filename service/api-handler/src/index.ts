import { S3Client } from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";
import { getSearchClient } from "@local/common";

import { getRoutes } from "./routes";

const s3Client = new S3Client({});

const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-api-handler", process.env.LogGroupName);
const searchClient = await getSearchClient(loggerProvider);
const restController = new ApiGatewayApiController(getRoutes(searchClient, s3Client), loggerProvider);

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