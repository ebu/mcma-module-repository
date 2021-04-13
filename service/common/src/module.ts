import { ModuleParameter } from "./module-parameter";
import { normalizeProvider, SupportedProvider } from "./supported-provider";
import { McmaException, McmaResource, McmaResourceProperties } from "@mcma/core";

export interface ModuleProperties extends McmaResourceProperties {
    namespace: string;
    name: string;
    provider: SupportedProvider;
    version: string;
    displayName: string;
    description: string;
    owner: string;
    inputParameters: ModuleParameter[];
    outputParameters: ModuleParameter[];
    tags: string[];
}

export class Module extends McmaResource implements ModuleProperties {
    namespace: string;
    name: string;
    provider: SupportedProvider;
    version: string;
    displayName: string;
    description: string;
    owner: string;
    inputParameters: ModuleParameter[];
    outputParameters: ModuleParameter[];
    tags: string[];

    constructor(props: ModuleProperties) {
        super("Module", props);

        this.checkProperty("namespace", "string", true);
        this.checkProperty("name", "string", true);
        this.checkProperty("provider", "string", true);
        this.checkProperty("version", "string", true);
        this.checkProperty("displayName", "string", false);
        this.checkProperty("description", "string", false);
        this.checkProperty("inputParameters", "Array", false);
        this.checkProperty("outputParameters", "Array", false);

        if (!/^[A-Za-z0-9-_]{3,}$/.test(this.name)) {
           throw new McmaException("Module 'name' field is invalid. Name must be at least 3 characters long and can only contain letters, numbers, dashes, and underscores.");
        }

        this.provider = normalizeProvider(this.provider);
        this.displayName = this.displayName || this.name;
        this.description = this.description || this.displayName;
        this.inputParameters = this.inputParameters || [];
        this.outputParameters = this.outputParameters || [];
    }
}