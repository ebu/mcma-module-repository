import { S3Client } from "@aws-sdk/client-s3";
import { McmaApiRouteCollection } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";

import { GetProvidersRoute } from "./get-providers-route.js";
import { GetVersionRoute } from "./get-version-route.js";
import { GetVersionsRoute } from "./get-versions-route.js";
import { PublishRoute } from "./publish-route.js";
import { SearchRoute } from "./search-route.js";
import { SearchNamespaceRoute } from "./search-namespace-route.js";

export function getRoutes(searchClient: ModuleSearchClient, s3Client: S3Client): McmaApiRouteCollection {
    return new McmaApiRouteCollection([
        new SearchRoute(searchClient),
        new SearchNamespaceRoute(searchClient),
        new GetProvidersRoute(searchClient),
        new GetVersionsRoute(searchClient),
        new GetVersionRoute(searchClient, s3Client),
        new PublishRoute(s3Client),
    ]);
}