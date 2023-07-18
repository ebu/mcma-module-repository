import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";

const { AuthWsDomain, LogGroupName } = process.env;

const apiGatewayManagement = new ApiGatewayManagementApiClient({
    endpoint: `https://${AuthWsDomain}`
});
const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-cli-tokens", LogGroupName);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const logger = loggerProvider.get(context.awsRequestId);
    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        const connectionId = event.pathParameters?.connectionId
        if (!connectionId) {
            logger.error("connectionId missing from pathParameters");
        }

        let accessToken: string;
        let idToken: string;
        try {
            ({ accessToken, idToken } = JSON.parse(event.body));
        } catch (error) {
            logger.error("Failed to deserialize body.", error);
            return {
                statusCode: 400,
                body: "Bad Request"
            };
        }

        if (!accessToken) {
            logger.error("Body does not contain accessToken");
            return {
                statusCode: 400,
                body: "Bad Request"
            };
        }

        await apiGatewayManagement.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify({
                accessToken,
                idToken
            })
        }));

        return {
            statusCode: 200,
            body: "Authentication Succeeded"
        };
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush(Date.now() + context.getRemainingTimeInMillis() - 5000);
    }
}