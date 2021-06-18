import { S3 } from "aws-sdk";
import { HttpStatusCode } from "@mcma/api";
import { McmaException } from "@mcma/core";
import { Module } from "@local/common";

const { ModuleBucket } = process.env;

export async function versionExistsAsync(s3: S3, module: Module): Promise<boolean> {
    const key = module.key + ".zip";
    try {
        await s3.headObject({ Bucket: ModuleBucket, Key: key }).promise();
        return true;
    } catch (error) {
        if (error.statusCode !== HttpStatusCode.NotFound) {
            throw new McmaException(`An error occurred checking the S3 bucket '${ModuleBucket}' for existing module with key '${key}'.`, error, module);
        }
        return false;
    }
}