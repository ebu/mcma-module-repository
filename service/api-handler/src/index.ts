import { McmaApiRouteCollection } from "@mcma/api";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";

const restController = new ApiGatewayApiController(new McmaApiRouteCollection());

export async function handler(event, context) {
    console.log(JSON.stringify(event, null, 2), JSON.stringify(context, null, 2));

    return await restController.handleRequest(event, context);
}
