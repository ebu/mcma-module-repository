import { S3Client } from "@aws-sdk/client-s3";
import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { buildS3Url } from "@mcma/aws-s3";
import { ModuleSearchClient } from "@local/common";
import { versionExistsAsync } from "../version-exists";

const { ModuleBucket } = process.env;

function createGetHandler(searchClient: ModuleSearchClient, s3Client: S3Client): McmaApiRouteHandler {
    return async (requestContext: McmaApiRequestContext) => {
        const { namespace, name, provider, version } = requestContext.request.pathVariables;

        const module = await searchClient.getModuleVersion(namespace, name, provider, version);
        if (!module || !await versionExistsAsync(s3Client, module)) {
            requestContext.setResponseResourceNotFound();
            return;
        }

        const downloadUrl = await buildS3Url(ModuleBucket, module.key + ".zip", s3Client);

        requestContext.setResponseBody(Object.assign({}, module, { downloadUrl }));

        const terraformGetParam =
            requestContext.request.queryStringParameters &&
            requestContext.request.queryStringParameters["terraform-get"];
        if (terraformGetParam === "1") {
            requestContext.response.headers = requestContext.response.headers ?? {};
            requestContext.response.headers["X-Terraform-Get"] = downloadUrl;
        }
    }
}

export class GetVersionRoute extends McmaApiRoute {
    constructor(searchClient: ModuleSearchClient, s3Client: S3Client) {
        super("GET", "/modules/{namespace}/{name}/{provider}/{version}", createGetHandler(searchClient, s3Client));
    }
}