import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { getTableName } from "@mcma/data";
import { Namespace } from "@local/common";

function createCreateNamespaceHandler(dynamoDbTableProvider: DynamoDbTableProvider): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const dbTable = await dynamoDbTableProvider.get(getTableName(requestContext.configVariables));
        
        const namespaceResults = dbTable.query<Namespace>({ path: "namespace" });

        requestContext.setResponseBody(namespaceResults);
    };
}

export class GetAllNamespacesRoute extends McmaApiRoute {
    constructor(dynamoDbTableProvider: DynamoDbTableProvider) {
        super("GET", "/namespaces", createCreateNamespaceHandler(dynamoDbTableProvider));
    }
}