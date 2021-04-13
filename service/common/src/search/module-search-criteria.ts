export interface ModuleSearchCriteria {
    keywords?: string[];
    namespace?: string;
    name?: string;
    providers?: string[];
    pageSize?: number;
    pageStartToken?: string;
    includePreRelease?: boolean;
}

export const defaultModuleSearchCriteria: ModuleSearchCriteria = {
    keywords: []
};