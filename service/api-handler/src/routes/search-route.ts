import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { ModuleSearchClient, ModuleSearchCriteria, defaultModuleSearchCriteria } from "@local/common";

function createSearchHandler(searchClient: ModuleSearchClient): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const params = requestContext.request.queryStringParameters;
        const searchCriteria: ModuleSearchCriteria = Object.assign({}, defaultModuleSearchCriteria, { namespace: params.namespace });
        if (params.providers) {
            searchCriteria.providers = params.providers?.split(",") ?? [];
        }
        if (params.keywords) {
            searchCriteria.keywords = params.providers?.split(",") ?? [];
        }
        if (params.includePreRelease) {
            searchCriteria.includePreRelease = params.includePreRelease.toLowerCase() === "true";
        }

        const results = await searchClient.searchModules(searchCriteria);

        requestContext.setResponseBody(results);
    }
}

export class SearchRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient) {
        super("GET", "/modules", createSearchHandler(searchClient));
    }
}