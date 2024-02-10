import { McmaApiRequestContext, McmaApiRoute } from "@mcma/api";
import { DocumentDatabaseTableProvider } from "@mcma/data";

function createGetNamespacesHandler(tableProvider: DocumentDatabaseTableProvider): (requestContext: McmaApiRequestContext) => Promise<void> {
    const table = tableProvider.get();
}

export class GetNamespacesRoute extends McmaApiRoute {
    constructor(tableProvider: DocumentDatabaseTableProvider) {
        super("GET", "/namespaces", createGetNamespacesHandler(tableProvider));
    }
}