import { EOL } from "os";
import { S3 } from "aws-sdk";
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { McmaException, Utils } from "@mcma/core";
import { HttpStatusCode, McmaApiRequestContext, McmaApiRoute } from "@mcma/api";
import { isSupportedProvider, Module, supportedProviders } from "@local/common"

const { ModuleStagingBucket, ModuleBucket, DefaultNamespace } = process.env;

const s3 = new S3();

function getModuleObjectKey(module: Module) {
    return `${module.namespace ?? DefaultNamespace}/${module.name}/${module.provider}/${module.version}.zip`;
}

async function handler(requestContext: McmaApiRequestContext): Promise<void> {
    const logger = requestContext.getLogger();
    const module = requestContext.getRequestBody<Module>();

    logger?.debug("Validating module data", module);
    const validationErrors = validateModule(module);
    if (validationErrors.length > 0) {
        requestContext.setResponseError(HttpStatusCode.BadRequest, `One or more validations of the provided module data failed:${EOL}${validationErrors.join(EOL)}`);
        return;
    }

    logger?.debug("Checking version existence", module.version);
    if (await versionExistsAsync(module)) {
        requestContext.setResponseError(HttpStatusCode.Conflict, `Version ${module.version} already exists for module ${module.name}`);
        return;
    }

    logger?.debug("Getting publish url");
    const publishUrl = await getPublishUrl(module);

    logger?.debug("Publish url successfully generated", publishUrl);
    requestContext.setResponseBody({ publishUrl });
}

function validateModule(module: Module): string[] {
    if (!module) {
        return ["Provided module data is null or undefined."];
    }

    const errors: string[] = [];
    if (!module.name || !module.name.length) {
        errors.push("Module 'name' field is missing or empty.");
    } else if (!/^[A-Za-z0-9-_]{3,}$/.test(module.name)) {
        errors.push("Module 'name' field is invalid. Name must be at least 3 characters long and can only contain letters, numbers, dashes, and underscores.");
    }

    if (!module.version || !module.version.length) {
        errors.push("Module 'version' field is missing or empty.");
    } else if (!/^\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\d+)?$/.test(module.version)) {
        errors.push("Module 'version' field is invalid. Version must be a valid semantic version, consisting of 3 integer values separated by dots. See https://semver.org for more info.");
    }

    if (!module.provider || !module.provider.length) {
        errors.push("Module 'provider' field is missing or empty.");
    } else if (!isSupportedProvider(module.provider)) {
        errors.push("Module 'provider' field is invalid. Provider must specify one of the following supported providers: " + supportedProviders.join(", "));
    }

    return errors;
}

async function versionExistsAsync(module: Module): Promise<boolean> {
    const key = getModuleObjectKey(module);
    try {
        await s3.headObject({ Bucket: ModuleBucket, Key: key }).promise();
        return true;
    } catch (error) {
        if (error.statusCode !== HttpStatusCode.NotFound) {
            throw new McmaException(`An error occurred checking the S3 bucket '${ModuleStagingBucket}' for existing module with key '${key}'.`, error, module);
        }
        return false;
    }
}

async function getPublishUrl(module: Module): Promise<string> {
    const moduleData = Utils.toBase64(JSON.stringify(module));
    const key = getModuleObjectKey(module);

    const putObjectRequest: PutObjectRequest = {
        Bucket: ModuleStagingBucket,
        Key: key,
        Metadata: {
            ["module-data"]: moduleData
        }
    };

    return await s3.getSignedUrlPromise("putObject", putObjectRequest);
}

export class PublishModuleRoute extends McmaApiRoute {
    constructor() {
        super("POST", "/modules/publish", handler);
    }
}