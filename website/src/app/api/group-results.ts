import type { Module, ModuleVersion } from "./model";

export function groupResults(moduleVersions: ModuleVersion[]): Module[] {
  const modulesByKey: { [key: string]: Module } = {};
  for (const moduleVersion of moduleVersions) {
    const key = moduleVersion.namespace + "|" + moduleVersion.name;

    let module = modulesByKey[key];
    if (!module) {
      module = {
        namespace: moduleVersion.namespace,
        name: moduleVersion.name,
        latestVersion: moduleVersion.version,
        displayName: moduleVersion.displayName,
        description: moduleVersion.description,
        tags: moduleVersion.tags || [],
        icon: moduleVersion.icon,
        repository: moduleVersion.repository,
        website: moduleVersion.website,

        providers: []
      };
      modulesByKey[key] = module;
    }

    let provider = module.providers.find(x => x.name === moduleVersion.provider);
    if (!provider) {
      provider = {
        name: moduleVersion.provider,
        latestVersion: moduleVersion.version,
        versions: [ moduleVersion.version ]
      };
      module.providers.push(provider)
    } else {
      provider.versions.push(moduleVersion.version);
    }
  }
  console.log("modulesByKey", modulesByKey);
  return Object.values(modulesByKey);
}
