import { S3 } from "aws-sdk";
import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { ModuleSearchClient } from "@local/common";
import { versionExistsAsync } from "../version-exists";

const { ModuleBucket } = process.env;

function createGetHandler(searchClient: ModuleSearchClient, s3: S3): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const { namespace, name, provider, version } = requestContext.request.pathVariables;

        const module = await searchClient.getModuleVersion(namespace, name, provider, version);
        if (!module || !await versionExistsAsync(s3, module)) {
            requestContext.setResponseResourceNotFound();
            return;
        }

        const downloadUrl = await s3.getSignedUrlPromise("getObject", {
            Bucket: ModuleBucket,
            Key: module.key + ".zip"
        });

        requestContext.setResponseBody(Object.assign({}, module, { downloadUrl }));
    }
}

export class GetVersionRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient, s3: S3) {
        super("GET", "/modules/{namespace}/{name}/{provider}/{version}", createGetHandler(searchClient, s3));
    }
}