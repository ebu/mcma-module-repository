import { S3 } from "aws-sdk";
import { McmaApiRouteCollection } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";

import { GetProvidersRoute } from "./get-providers-route";
import { GetVersionRoute } from "./get-version-route";
import { GetVersionsRoute } from "./get-versions-route";
import { PublishRoute } from "./publish-route";
import { SearchRoute } from "./search-route";
import { SearchNamespaceRoute } from "./search-namespace-route";

export function getRoutes(searchClient: ModuleSearchClient, s3: S3): McmaApiRouteCollection {
    return new McmaApiRouteCollection([
        new SearchRoute(searchClient),
        new SearchNamespaceRoute(searchClient),
        new GetProvidersRoute(searchClient),
        new GetVersionsRoute(searchClient),
        new GetVersionRoute(searchClient, s3),
        new PublishRoute(s3),
    ]);
}