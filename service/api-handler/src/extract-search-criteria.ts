import { McmaApiRequestContext } from "@mcma/api";
import { defaultModuleSearchCriteria, ModuleSearchCriteria } from "@local/common";

export function extractSearchCriteria(requestContext: McmaApiRequestContext) {
    const params = requestContext.request.queryStringParameters;
    const searchCriteria: ModuleSearchCriteria = Object.assign({}, defaultModuleSearchCriteria, { namespace: params.namespace });
    if (params.providers) {
        searchCriteria.providers = params.providers?.split(",") ?? [];
    }
    if (params.keywords) {
        searchCriteria.keywords = params.keywords?.split(",") ?? [];
    }
    if (params.includePreRelease) {
        searchCriteria.includePreRelease = params.includePreRelease.toLowerCase() === "true";
    }
    return searchCriteria;
}