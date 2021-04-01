import * as AWS from "aws-sdk";
import { Context, S3Event } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { ConfigVariables, McmaTracker } from "@mcma/core";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const loggerProvider = new AwsCloudWatchLoggerProvider("module-repository-publish-trigger", process.env.LogGroupName);
const configVariables = new ConfigVariables();

export async function handler(event: S3Event, context: Context) {
    const logger = loggerProvider.get(context.awsRequestId);
    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        for (const record of event.Records) {
            try {
                await lambda.invoke({
                    FunctionName: configVariables.get("WorkerFunctionId"),
                    InvocationType: "Event",
                    LogType: "None",
                    Payload: JSON.stringify({
                        operationName: "publishModule",
                        input: {
                            key: record.s3.object.key
                        },
                        tracker: new McmaTracker({
                            id: `publish-module-${record.s3.object.key.replace(/\//g, "-")}-${uuidv4()}`,
                            label: `Publish Module ${record.s3.object.key}`
                        })
                    })
                }).promise();
            } catch (error) {
                logger.error("Failed processing record");
                logger.error(record);
                logger.error(error?.toString());
            }
        }
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush();
    }
}