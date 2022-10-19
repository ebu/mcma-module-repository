import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { ModuleSearchClient, supportedProviders } from "@local/common";

function createGetProvidersHandler(searchClient: ModuleSearchClient): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const { namespace, name } = requestContext.request.pathVariables;

        const providers = requestContext.request.queryStringParameters?.providers?.split(",") ?? [...supportedProviders];
        const includePreRelease = requestContext.request.queryStringParameters?.includePreRelease?.toLowerCase() === "true";

        const moduleVersions = await searchClient.getModuleVersions(namespace, name, providers, includePreRelease);

        requestContext.setResponseBody(moduleVersions);
    };
}

export class GetProvidersRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient) {
        super("GET", "/modules/{namespace}/{name}", createGetProvidersHandler(searchClient));
    }
}