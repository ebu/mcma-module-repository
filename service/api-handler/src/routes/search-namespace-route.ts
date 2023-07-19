import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";
import { extractSearchCriteria } from "../extract-search-criteria.js";

function createSearchNamespaceHandler(searchClient: ModuleSearchClient): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const searchCriteria = extractSearchCriteria(requestContext);
        searchCriteria.namespace = requestContext.request.pathVariables.namespace;
        const results = await searchClient.searchModules(searchCriteria);
        requestContext.setResponseBody(results);
    }
}

export class SearchNamespaceRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient) {
        super("GET", "/modules/{namespace}", createSearchNamespaceHandler(searchClient));
    }
}