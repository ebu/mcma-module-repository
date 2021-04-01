import * as fs from "fs";
import * as yauzl from "yauzl-promise";
import { S3 } from "aws-sdk"
import { v4 as uuidv4 } from "uuid";
import { McmaException } from "@mcma/core";

const s3 = new S3();

export async function downloadZip(bucket: string, key: string): Promise<{ body: S3.Body, metadata: S3.Metadata }> {
    const getResponse = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    if (!getResponse.Body) {
        throw new McmaException(`Failed to download module package from bucket ${bucket} with key ${key}`);
    }

    return { body: getResponse.Body, metadata: getResponse.Metadata };
}

export async function openZip(key: string, body: S3.Body): Promise<{ tempZipPath: string, zipFile: yauzl.ZipFile }> {
    const tempDir = `/tmp/${uuidv4()}`;
    await fs.promises.mkdir(tempDir, { recursive: true });

    const tempFilePath = `${tempDir}/${key.replace(/\//g, "-")}`;
    await fs.promises.writeFile(tempFilePath, body);

    return {
        tempZipPath: tempFilePath,
        zipFile: await yauzl.open(tempFilePath)
    };
}

export async function readZip(zipFile: yauzl.ZipFile, handleEntry: (entry: yauzl.Entry) => Promise<boolean>): Promise<void> {
    let entry: yauzl.Entry;
    while (entry = await zipFile.readEntry()) {
        if (!await handleEntry(entry))
            break;
    }
}

export async function openAndReadZip(key: string, body: S3.Body, handleEntry: (entry: yauzl.Entry) => Promise<boolean>): Promise<void> {
    const { tempZipPath, zipFile } = await openZip(key, body);
    try {
        await readZip(zipFile, handleEntry);
    } finally {
        try {
            fs.unlinkSync(tempZipPath);
        } catch {}
    }
}

export async function downloadAndReadZip(bucket: string, key: string, handleEntry: (entry: yauzl.Entry) => Promise<boolean>): Promise<void> {
    const { body } = await downloadZip(bucket, key);

    await openAndReadZip(key, body, handleEntry);
}

export async function readTextFile(entry: yauzl.Entry): Promise<string> {
    const readable = await entry.openReadStream();
    const readPromise = new Promise<string>((res, rej) => {
        let text = "";
        readable.on("data", (data: Buffer) => text += data.toString("utf-8"));
        readable.on("end", () => res(text));
        readable.on("error", e => rej(e));
    });
    return await readPromise;
}