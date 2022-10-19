import { Module } from "../module";
import { ModuleSearchData } from "./module-search-data";
import * as Elastic from "./elastic-types";
import { Version } from "../version";
import { normalizeProvider } from "../supported-provider";

export const ID_DELIMITER = "_";

export function moduleToSearchData(module: Module): ModuleSearchData {
    const parsedVersion = Version.parse(module.version);
    return Object.assign({}, module, {
        fullyQualifiedName: module.namespace + "/" + module.name,
        provider: normalizeProvider(module.provider),
        isPreRelease: !!parsedVersion.preReleaseStage,
        hasPreRelease: false,
        parsedVersion
    });
}

export function searchDataToModule(searchData: ModuleSearchData): Module {
    delete searchData.fullyQualifiedName;
    delete searchData.isPreRelease;
    delete searchData.hasPreRelease;
    delete searchData.parsedVersion;

    return new Module(searchData);
}

export function getElasticId(moduleSearchData: Module | ModuleSearchData): string {
    const { namespace, name, provider, version } = moduleSearchData;
    return [namespace, name, provider, version].join(ID_DELIMITER);
}

export function getPreReleaseBoolQuery(includePreRelease: boolean): Elastic.Match {
    if (!includePreRelease) {
        return { match: { isPreRelease: false }};
    } else {
        return {
            bool: {
                should: [
                    { match: { isPreRelease: true } },
                    { match: { hasPreRelease: false } }
                ]
            }
        };
    }
}

export const descendingVersionSort: Elastic.Sort = {
    "parsedVersion.major": { order: "desc" },
    "parsedVersion.minor": { order: "desc" },
    "parsedVersion.patch": { order: "desc" },
    "parsedVersion.preReleaseStage": { order: "desc" },
    "parsedVersion.preReleaseNumber": { order: "desc" }
};