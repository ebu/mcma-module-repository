import { S3 } from "aws-sdk";
import { McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { buildS3Url } from "@mcma/aws-s3";
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

        const downloadUrl = await buildS3Url(ModuleBucket, module.key + ".zip", s3.config.region);

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
    constructor(searchClient: ModuleSearchClient, s3: S3) {
        super("GET", "/modules/{namespace}/{name}/{provider}/{version}", createGetHandler(searchClient, s3));
    }
}