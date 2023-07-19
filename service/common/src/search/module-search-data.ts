import { ModuleProperties } from "../module.js";
import { Version } from "../version.js";

export interface ModuleSearchData extends ModuleProperties {
    fullyQualifiedName: string;
    isPreRelease: boolean;
    hasPreRelease: boolean;
    parsedVersion: Version;
}