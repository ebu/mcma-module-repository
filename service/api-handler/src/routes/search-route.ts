import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";
import { extractSearchCriteria } from "../extract-search-criteria.js";

function createSearchHandler(searchClient: ModuleSearchClient): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const searchCriteria = extractSearchCriteria(requestContext);
        const results = await searchClient.searchModules(searchCriteria);
        requestContext.setResponseBody(results);
    }
}

export class SearchRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient) {
        super("GET", "/modules", createSearchHandler(searchClient));
    }
}