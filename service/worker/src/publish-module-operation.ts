import { S3 } from "aws-sdk";
import { Utils } from "@mcma/core";
import { OperationHandler, ProviderCollection, WorkerRequest } from "@mcma/worker";
import { Module } from "@local/common";
import { downloadZip, openAndReadZip, readTextFile } from "./helpers";

const { ModuleStagingBucket, ModuleBucket } = process.env;

type PublishModuleRequest = {
    key: string;
};

export function createPublishModuleHandler(): OperationHandler {
    const s3 = new S3();
    return async (providerCollection: ProviderCollection, request: WorkerRequest) => {
        const publishModuleRequest = <PublishModuleRequest>request.input;
        try {
            const { body, metadata } = await downloadZip(ModuleStagingBucket, publishModuleRequest.key);
            request.logger.info("Metadata for zip", metadata);

            let moduleJson: string = "";
            let hasTf = false;
            await openAndReadZip(publishModuleRequest.key, body, async entry => {
                if (entry.fileName && entry.fileName.toLowerCase() === "module.json") {
                    moduleJson = await readTextFile(entry);
                }
                if (entry.fileName && entry.fileName.toLowerCase().endsWith(".tf")) {
                    hasTf = true;
                }
                return true;
            });

            request.logger.info("Checking zip contents for module.json and at least one .tf file...");
            if (!moduleJson.length) {
                request.logger?.error(`module.json file not found in zip from bucket ${ModuleStagingBucket} with key ${publishModuleRequest.key}`);
                return;
            }
            if (!hasTf) {
                request.logger?.error(`No Terraform files (.tf) found in zip from bucket ${ModuleStagingBucket} with key ${publishModuleRequest.key}`);
                return;
            }
            request.logger.info("module.json and .tf files found. Comparing module.json contents against object metadata...");

            const moduleJsonBase64 = metadata && metadata["module-data"];
            if (!moduleJsonBase64) {
                request.logger?.error(`'moduleData' missing in metadata on object in bucket ${ModuleStagingBucket} with key ${publishModuleRequest.key}`);
                return;
            }

            const module = new Module(JSON.parse(moduleJson));
            const moduleFromMetadata = new Module(JSON.parse(Utils.fromBase64(moduleJsonBase64)));
            if (JSON.stringify(module, null, 2) !== JSON.stringify(moduleFromMetadata, null, 2)) {
                request.logger?.error(`'module-data' in metadata on object in bucket ${ModuleStagingBucket} with key ${publishModuleRequest.key} does not match the module.json provided in the zip package.`);
                return;
            }
            request.logger.info(`Contents of module.json and module from object metadata match. Verifying content against object key '${publishModuleRequest.key}'...`);

            const [namespaceFromKey, moduleNameFromKey, providerFromKey, versionZipFromKey] = publishModuleRequest.key.split("/");
            const versionFromKey = versionZipFromKey.replace(/.zip$/g, "");

            if (module.namespace !== namespaceFromKey || module.name !== moduleNameFromKey || module.provider !== providerFromKey || module.version !== versionFromKey) {
                request.logger?.error(`One or more properties in module.json do not match values in object key ${publishModuleRequest.key}: ${moduleJson}`);
                return;
            }
            request.logger.info(`Contents of module.json matches object key. Copying to key ${publishModuleRequest.key} in modules bucket ${ModuleBucket}...`);

            await s3.copyObject({
                CopySource: `/${ModuleStagingBucket}/${publishModuleRequest.key}`,
                Bucket: ModuleBucket,
                Key: publishModuleRequest.key,
                ACL: "public-read",
                ContentDisposition: "attachment; filename=\"" + publishModuleRequest.key.replace(/\//g, "_") + "\""
            }).promise();
            request.logger.info("Successfully copied to modules bucket.");
        } finally {
            try {
                await s3.deleteObject({ Bucket: ModuleStagingBucket, Key: publishModuleRequest.key }).promise();
            } catch (e) {
                request.logger?.error(`Failed to delete object ${publishModuleRequest.key} from bucket ${ModuleStagingBucket}`);
            }
        }
    };
}