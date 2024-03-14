import { EOL } from "os";
import { HttpStatusCode, McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler, getPublicUrl } from "@mcma/api";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { getTableName } from "@mcma/data";

import { NamespaceProperties, Namespace } from "@local/common";

function createCreateNamespaceHandler(dynamoDbTableProvider: DynamoDbTableProvider): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const logger = requestContext.getLogger();

        const namespaceProperties = requestContext.getRequestBody<NamespaceProperties>();

        logger?.debug("Validating namespace data", namespaceProperties);
        let namespace;
        try {
            namespace = new Namespace(namespaceProperties);
        } catch (e) {
            requestContext.setResponseError(HttpStatusCode.BadRequest, `Provided module data is invalid:${EOL}${e.message}`);
            return;
        }

        logger?.debug("Creating namespace", namespaceProperties);

        const dbTable = await dynamoDbTableProvider.get(getTableName(requestContext.configVariables));
        
        const path = `/namespaces/${namespace.name}`;

        namespace.id = getPublicUrl() + path;
        namespace.dateCreated = namespace.dateModified = new Date();

        const existing = dbTable.get(namespace.id);
        if (existing) {
            requestContext.setResponseError(HttpStatusCode.Conflict, `Namespace '${namespace.id}' already exists`);
            return;
        }

        namespace = await dbTable.put(path, namespace);
        logger?.debug("Successfully created namespace", namespaceProperties);

        requestContext.setResponseResourceCreated(namespace);
    };
}

export class CreateNamespaceRoute extends McmaApiRoute {
    constructor(dynamoDbTableProvider: DynamoDbTableProvider) {
        super("POST", "/namespaces/{namespace}", createCreateNamespaceHandler(dynamoDbTableProvider));
    }
}