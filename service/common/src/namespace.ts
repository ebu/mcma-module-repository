import { McmaResource, McmaResourceProperties, Utils } from "@mcma/core";

export interface NamespaceProperties extends McmaResourceProperties {
    name: string;
    icon?: string;
    url?: string;
}

export class Namespace extends McmaResource implements NamespaceProperties {
    name: string;
    icon?: string;
    url?: string;

    constructor(props: NamespaceProperties) {
        super("Namespace", props);

        Object.assign(this, props);

        Utils.checkProperty(this, "name", "string", true);
        Utils.checkProperty(this, "icon", "string", false);
        Utils.checkProperty(this, "url", "url", false);
    }
}