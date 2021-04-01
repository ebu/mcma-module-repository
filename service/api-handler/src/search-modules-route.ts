import { McmaApiRequestContext, McmaApiRoute } from "@mcma/api";
import { McmaModuleSearchClient } from "@local/common";
import { AuthProvider } from "@mcma/client";
import { McmaApiRouteHandler } from "@mcma/api/dist/lib/routing/route-handler";

const { ElasticEndpoint, ElasticIndex, ElasticAuthType, ElasticAuthContext } = process.env;

function getHandler(searchClient: McmaModuleSearchClient): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const keywords = requestContext.request.queryStringParameters.keywords?.split(",") ?? [];

        const results = await searchClient.search(keywords);

        requestContext.setResponseBody(results);
    }
}

export class SearchModulesRoute extends McmaApiRoute {
    constructor(authProvider: AuthProvider) {
        const searchClient = new McmaModuleSearchClient({
            endpoint: ElasticEndpoint,
            index: ElasticIndex,
            authenticator: authProvider.get(ElasticAuthType, ElasticAuthContext)
        });

        super("GET", "/modules", getHandler(searchClient));
    }
}