import type { ModuleProvider } from "./module-provider";

export interface Module {
  namespace: string;
  name: string;
  latestVersion: string;
  providers: ModuleProvider[];
  displayName: string;
  description: string;
  tags: string[];
  icon: string;
  website: string;
  repository: string;
}

