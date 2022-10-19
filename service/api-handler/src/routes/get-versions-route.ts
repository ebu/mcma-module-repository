import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";

function createGetVersionsHandler(searchClient: ModuleSearchClient): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const { namespace, name, provider } = requestContext.request.pathVariables;
        const includePreRelease = requestContext.request.queryStringParameters?.includePreRelease?.toLowerCase() === "true";
        const moduleVersions = await searchClient.getModuleVersions(namespace, name, [provider], includePreRelease);
        requestContext.setResponseBody(moduleVersions);
    };
}

export class GetVersionsRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient) {
        super("GET", "/modules/{namespace}/{name}/{provider}", createGetVersionsHandler(searchClient));
    }
}