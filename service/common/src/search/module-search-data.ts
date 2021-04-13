import { ModuleProperties } from "../module";
import { Version } from "../version";

export interface ModuleSearchData extends ModuleProperties {
    isPreRelease: boolean;
    hasPreRelease: boolean;
    parsedVersion: Version;
}