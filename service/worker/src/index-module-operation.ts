import { OperationHandler } from "@mcma/worker";
import { McmaModuleSearchClient, Module } from "@local/common";
import { downloadAndReadZip, readTextFile } from "./helpers";
import { AuthProvider } from "@mcma/client";

const { ModuleBucket, ElasticEndpoint, ElasticIndex, ElasticAuthType, ElasticAuthContext } = process.env;

type IndexModuleRequest = {
    key: string;
};

export function createIndexModuleHandler(authProvider: AuthProvider): OperationHandler {
    const searchClient = new McmaModuleSearchClient({
        endpoint: ElasticEndpoint,
        index: ElasticIndex,
        authenticator: authProvider.get(ElasticAuthType, ElasticAuthContext)
    });

    return async (_, request) => {
        const indexModuleRequest = <IndexModuleRequest>request.input;

        let moduleJson = "";
        await downloadAndReadZip(ModuleBucket, indexModuleRequest.key, async entry => {
            if (entry.fileName && entry.fileName.toLowerCase() === "module.json") {
                moduleJson = await readTextFile(entry);
                return false;
            }
            return true;
        });

        if (!moduleJson.length) {
            request.logger?.error(`module.json file not found in zip from bucket ${ModuleBucket} with key ${indexModuleRequest.key}`);
            return;
        }

        const module = JSON.parse(moduleJson) as Module;
        await searchClient.index([module.namespace, module.name, module.provider, module.version].join("/"), module);
    };
}