import { S3 } from "aws-sdk";
import { McmaApiRouteCollection } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";

import { GetVersionRoute } from "./get-version-route";
import { GetVersionsRoute } from "./get-versions-route";
import { PublishRoute } from "./publish-route";
import { SearchRoute } from "./search-route";

export function getRoutes(searchClient: ModuleSearchClient, s3: S3): McmaApiRouteCollection {
    return new McmaApiRouteCollection([
        new GetVersionRoute(searchClient, s3),
        new GetVersionsRoute(searchClient),
        new PublishRoute(s3),
        new SearchRoute(searchClient)
    ]);
}