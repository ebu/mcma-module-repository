export interface ModuleSearchParams {
  q: string;
  namespace?: string;
  provider?: string;
  tags?: string[];
  includePreRelease: boolean;
}

export class ModuleSearchParams {
  q: string;
  namespace?: string;
  provider?: string;
  tags?: string[];
  includePreRelease: boolean;

  constructor(q: string, namespace?: string, provider?: string, tags?: string[], includePreRelease?: string | boolean | undefined) {
    this.q = q ?? "";
    this.namespace = namespace;
    this.provider = provider;
    this.tags = tags;
    this.includePreRelease = includePreRelease === "true";
  }
}
