export interface ModuleSearchParams {
  q: string;
  includePreRelease: boolean;
}

export class ModuleSearchParams {
  q: string;
  includePreRelease: boolean;

  constructor(q: string, includePreRelease: string | boolean | undefined) {
    this.q = q ?? "";
    this.includePreRelease = includePreRelease === "true";
  }
}
