import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Context, S3Event } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { ConfigVariables, McmaTracker } from "@mcma/core";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";

const lambdaClient = new LambdaClient({});
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
                await lambdaClient.send(new InvokeCommand({
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
                }));
            } catch (error) {
                logger.error("Failed processing record");
                logger.error({ error, record });
            }
        }
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush();
    }
}