import { normalizeProvider, SupportedProvider } from "./supported-provider";
import { McmaException, McmaResource, McmaResourceProperties, Utils } from "@mcma/core";

export interface ModuleProperties extends McmaResourceProperties {
    readonly key: string;
    namespace: string;
    name: string;
    provider: SupportedProvider;
    version: string;

    displayName?: string;
    description?: string;
    tags?: string[];

    icon?: string;
    website?: string;
    repository?: string;
}

export class Module extends McmaResource implements ModuleProperties {
    namespace: string;
    name: string;
    provider: SupportedProvider;
    version: string;

    displayName: string;
    description: string;
    tags: string[];

    icon?: string;
    website?: string;
    repository?: string;

    constructor(props: ModuleProperties) {
        super("Module", props);

        Utils.checkProperty(this, "namespace", "string", true);
        Utils.checkProperty(this, "name", "string", true);
        Utils.checkProperty(this, "provider", "string", true);
        Utils.checkProperty(this, "version", "string", true);

        Utils.checkProperty(this, "displayName", "string", false);
        Utils.checkProperty(this, "description", "string", false);
        Utils.checkProperty(this, "tags", "Array", false);
        Utils.checkProperty(this, "icon", "string", false);
        Utils.checkProperty(this, "website", "string", false);
        Utils.checkProperty(this, "repository", "string", false);

        if (!/^[A-Za-z0-9-_]{3,}$/.test(this.name)) {
           throw new McmaException("Module 'name' field is invalid. Name must be at least 3 characters long and can only contain letters, numbers, dashes, and underscores.");
        }

        this.provider = normalizeProvider(this.provider);

        this.displayName = this.displayName ?? this.name;
        this.description = this.description ?? this.displayName;
        this.tags = this.tags ?? [];

        this.website = this.website ?? this.repository;
    }

    get key(): string {
        return [this.namespace, this.name, this.provider, this.version].join("/");
    }
}