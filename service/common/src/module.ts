import { ModuleParameter } from "./module-parameter";
import { SupportedProvider } from "./supported-provider";

export interface Module {
    name: string;
    version: string;
    namespace: string;
    provider: SupportedProvider;
    displayName: string;
    description: string;
    inputParameters: ModuleParameter[];
    outputParameters: ModuleParameter[];
}