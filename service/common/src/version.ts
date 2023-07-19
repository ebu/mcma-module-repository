import { McmaException } from "@mcma/core";
import { PreReleaseStage } from "./pre-release-stage.js";

export class Version {
    constructor(
        public readonly major: number,
        public readonly minor: number,
        public readonly patch: number,
        public readonly preReleaseStage?: PreReleaseStage,
        public readonly preReleaseNumber?: number
    ) {
    }

    static parse(version: string): Version {
        if (!version) {
            return undefined;
        }

        const releaseParts = version.split("-");
        const preReleaseLabel = releaseParts[1];
        version = releaseParts[0];

        const versionParts = version.split(".");
        if (versionParts.length != 3) {
            throw new McmaException(`Invalid semantic version '${version}'. Must contain 3 parts delimited by periods.`);
        }

        const major = parseInt(versionParts[0]);
        if (isNaN(major) || major < 0) {
            throw new McmaException(`Invalid semantic version '${version}'. Major value '${versionParts[0]}' must be a non-negative integer value.`);
        }
        const minor = parseInt(versionParts[1]);
        if (isNaN(minor) || minor < 0) {
            throw new McmaException(`Invalid semantic version '${version}'. Minor value '${versionParts[1]}' must be a non-negative integer value.`);
        }
        const patch = parseInt(versionParts[2]);
        if (isNaN(patch) || patch < 0) {
            throw new McmaException(`Invalid semantic version '${version}'. Patch value '${versionParts[2]}' must be a non-negative integer value.`);
        }

        if (!preReleaseLabel) {
            return new Version(major, minor, patch);
        }

        let preReleaseStage: PreReleaseStage;

        let preReleaseNumberText: string;
        if (preReleaseLabel.toLowerCase().startsWith("alpha")) {
            preReleaseStage = "alpha";
            preReleaseNumberText = preReleaseLabel.substring("alpha".length);
        } else if (preReleaseLabel.toLowerCase().startsWith("beta")) {
            preReleaseStage = "beta";
            preReleaseNumberText = preReleaseLabel.substring("beta".length);
        } else if (preReleaseLabel.toLowerCase().startsWith("rc")) {
            preReleaseStage = "rc";
            preReleaseNumberText = preReleaseLabel.substring("rc".length);
        }

        if (!preReleaseStage)
            throw new McmaException(`Invalid semantic version '${version}'. Pre-release label '${preReleaseLabel}' does not start with a known pre-release stage ('alpha', 'beta', or 'rc').`);

        const preReleaseNumber = parseInt(preReleaseNumberText);
        if (isNaN(preReleaseNumber) || preReleaseNumber < 0) {
            throw new McmaException(`Invalid semantic version '${version}'. Pre-release number '${preReleaseNumberText}' must be a non-negative integer value.`);
        }

        return new Version(major, minor, patch, preReleaseStage, preReleaseNumber);
    }

    static compare(version1: Version | string, version2: Version | string): number {
        if (typeof version1 === "string") {
            version1 = Version.parse(version1);
        }
        if (typeof version2 === "string") {
            version2 = Version.parse(version2);
        }
        const majorCompare = version1.major - version2.major;
        if (majorCompare !== 0) {
            return majorCompare;
        }
        const minorCompare = version1.minor - version2.minor;
        if (minorCompare !== 0) {
            return minorCompare;
        }
        const patchCompare = version1.patch - version2.patch;
        if (patchCompare !== 0) {
            return patchCompare;
        }
        if (!version1.preReleaseStage && !version2.preReleaseStage) {
            return 0;
        }
        if (!version1.preReleaseStage && !!version2.preReleaseStage) {
            return 1;
        }
        if (!!version1.preReleaseStage && !version2.preReleaseStage) {
            return -1;
        }
        const preReleaseStageCompare = version1.preReleaseStage.localeCompare(version2.preReleaseStage);
        if (preReleaseStageCompare !== 0) {
            return preReleaseStageCompare;
        }
        return version1.preReleaseNumber - version2.preReleaseNumber;
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}${this.preReleaseStage ? `-${this.preReleaseStage}${this.preReleaseNumber}` : ""}`;
    }
}