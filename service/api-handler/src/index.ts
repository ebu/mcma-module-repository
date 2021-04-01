import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { McmaApiRouteCollection } from "@mcma/api";
import { AuthProvider } from "@mcma/client";
import { awsV4Auth } from "@mcma/aws-client";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";

import { PublishModuleRoute } from "./publish-module-route";
import { SearchModulesRoute } from "./search-modules-route";

const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-api-handler", process.env.LogGroupName);
const authProvider = new AuthProvider().add(awsV4Auth(AWS));

const routes = [
   new PublishModuleRoute(),
   new SearchModulesRoute(authProvider)
];

const restController = new ApiGatewayApiController(new McmaApiRouteCollection(routes), loggerProvider);

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