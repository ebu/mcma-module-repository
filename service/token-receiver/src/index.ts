import * as AWS from "aws-sdk";
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";

const WebsocketApiConnectionsEndpoint = process.env.WEBSOCKET_API_CONNECTIONS_ENDPOINT;

const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
    endpoint: WebsocketApiConnectionsEndpoint
});

export async function handler(event: APIGatewayProxyEvent, _: Context): Promise<APIGatewayProxyResult> {
    const messageToPost = {
        ConnectionId: event.pathParameters.connectionId,
        Data: event.body
    };

    const { $response } = await apiGatewayManagementApi.postToConnection(messageToPost).promise();

    if ($response.error) {
        return {
            statusCode: 400,
            body: "Failed to post message"
        };
    }

    return {
        statusCode: 200,
        body: ""
    };
}