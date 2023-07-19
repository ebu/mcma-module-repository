import { EOL } from "os";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Utils } from "@mcma/core";
import { HttpStatusCode, McmaApiRequestContext, McmaApiRoute, McmaApiRouteHandler } from "@mcma/api";
import { Module, ModuleProperties} from "@local/common"
import { versionExistsAsync } from "../version-exists.js";

const { ModuleStagingBucket } = process.env;

function createPublishHandler(s3Client: S3Client): McmaApiRouteHandler {

    async function getPublishUrl(module: Module): Promise<string> {
        const moduleData = Utils.toBase64(JSON.stringify(module));
        const key = module.key + ".zip";

        const putObjectCommand = new PutObjectCommand({
            Bucket: ModuleStagingBucket,
            Key: key,
            Metadata: {
                ["module-data"]: moduleData
            }
        });

        return await getSignedUrl(s3Client, putObjectCommand);
    }

    return async (requestContext: McmaApiRequestContext) => {
        const logger = requestContext.getLogger();
        const moduleProperties = requestContext.getRequestBody<ModuleProperties>();

        logger?.debug("Validating module data", moduleProperties);
        let module;
        try {
            module = new Module(moduleProperties);
        } catch (e) {
            requestContext.setResponseError(HttpStatusCode.BadRequest, `Provided module data is invalid:${EOL}${e.message}`);
            return;
        }

        logger?.debug("Checking version existence", module.version);
        if (await versionExistsAsync(s3Client, module)) {
            requestContext.setResponseError(HttpStatusCode.Conflict, `Version ${module.version} already exists for module ${module.name}`);
            return;
        }

        logger?.debug("Getting publish url");
        const publishUrl = await getPublishUrl(module);

        logger?.debug("Publish url successfully generated", publishUrl);
        requestContext.setResponseBody({ publishUrl });
    };
}

export class PublishRoute extends McmaApiRoute {
    constructor(s3Client: S3Client) {
        super("POST", "/modules/publish", createPublishHandler(s3Client));
    }
}