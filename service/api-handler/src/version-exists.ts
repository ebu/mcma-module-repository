import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { HttpStatusCode } from "@mcma/api";
import { McmaException } from "@mcma/core";
import { Module } from "@local/common";

const { ModuleBucket } = process.env;

export async function versionExistsAsync(s3Client: S3Client, module: Module): Promise<boolean> {
    const key = module.key + ".zip";
    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: ModuleBucket, Key: key }));
        return true;
    } catch (error) {
        if (error.statusCode !== HttpStatusCode.NotFound) {
            throw new McmaException(`An error occurred checking the S3 bucket '${ModuleBucket}' for existing module with key '${key}'.`, error, module);
        }
        return false;
    }
}