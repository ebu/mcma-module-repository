function decodeS3EventKey(key: string = "") {
    return decodeURIComponent(key.replace(/\+/g, " "));
}

export async function handler(event, context) {
    console.log(JSON.stringify(event, null, 2), JSON.stringify(context, null, 2));

    for (const record of event.Records) {
        const awsS3Bucket = record.s3 && record.s3.bucket.name;
        const awsS3Key = decodeS3EventKey(record.s3?.object?.key);


        console.log(awsS3Bucket, awsS3Key);
    }
}
