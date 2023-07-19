import { OperationHandler } from "@mcma/worker";
import { Module, ModuleSearchClient, ModuleProperties } from "@local/common";
import { downloadAndReadZip, readTextFile } from "./helpers.js";

const { ModuleBucket, ModulesBaseUrl } = process.env;

type IndexModuleRequest = {
    key: string;
};

export function createIndexModuleHandler(searchClient: ModuleSearchClient): OperationHandler {
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

        const moduleProperties = JSON.parse(moduleJson) as ModuleProperties;
        const module = new Module(moduleProperties);
        module.id = ModulesBaseUrl.replace(/\/+$/, "") + "/" + module.key;
        module.dateCreated = new Date();

        await searchClient.index(module);
    };
}