import { OperationHandler } from "@mcma/worker";
import { Module, ModuleSearchClient } from "@local/common";
import { downloadAndReadZip, readTextFile } from "./helpers";
import { ModuleProperties } from "../../common/build/staging";

const { ModuleBucket, RepositoryBaseUrl } = process.env;

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
        const { namespace, name, provider, version } = moduleProperties;

        const module = new Module(moduleProperties);
        module.id = RepositoryBaseUrl.replace(/\/+$/, "") + "/" + [namespace, name, provider, version].join("/");
        module.dateCreated = new Date();

        await searchClient.index(module);
    };
}