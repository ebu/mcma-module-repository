import { HttpClient } from "@mcma/client";
import { Logger } from "@mcma/core";
import { Module } from "../module.js";
import { Version } from "../version.js";
import { ModuleSearchClientOptions } from "./module-search-client-options.js";
import { ModuleSearchCriteria, defaultModuleSearchCriteria } from "./module-search-criteria.js";
import { ModuleSearchData } from "./module-search-data.js";
import { ModuleSearchResults } from "./module-search-results.js";
import { normalizeProvider } from "../supported-provider.js";
import * as Elastic from "./elastic-types.js";
import {
    descendingVersionSort,
    getElasticId,
    getPreReleaseBoolQuery,
    ID_DELIMITER, moduleToSearchData, searchDataToModule
} from "./helpers.js";

export class ModuleSearchClient {
    private readonly httpClient: HttpClient;
    private readonly logger: Logger;

    constructor(private readonly options: ModuleSearchClientOptions) {
        this.httpClient = new HttpClient(this.options.authenticator, this.options.httpClientConfig);
        this.logger = this.options.logger ?? Logger.System;
    }

    private getLatestVersionUrl(path: string) {
        return `${this.options.endpoint}/${this.options.latestVersionsIndex}/${path}`;
    }

    private async addToLatestVersionIndex(moduleSearchData: ModuleSearchData): Promise<void> {
        this.logger.info(`Adding version ${moduleSearchData.version} to latest-versions index.`);
        await this.httpClient.put(moduleSearchData, this.getLatestVersionUrl(`_doc/${getElasticId(moduleSearchData)}`));
    }

    private getPreviousVersionUrl(path: string) {
        return `${this.options.endpoint}/${this.options.previousVersionsIndex}/${path}`;
    }

    private async addToPreviousVersionIndex(moduleSearchData: ModuleSearchData): Promise<void> {
        this.logger.info(`Adding version ${moduleSearchData.version} to previous-versions index.`);
        await this.httpClient.put(moduleSearchData, this.getPreviousVersionUrl(`_doc/${getElasticId(moduleSearchData)}`));
    }

    private async moveToPreviousVersionIndex(moduleSearchData: ModuleSearchData): Promise<void> {
        const elasticId = getElasticId(moduleSearchData);
        await this.httpClient.put(moduleSearchData, this.getPreviousVersionUrl(`_doc/${elasticId}`));
        await this.httpClient.delete(this.getLatestVersionUrl(`_doc/${elasticId}`));
    }

    async index(module: Module): Promise<void> {
        const moduleSearchData: ModuleSearchData = moduleToSearchData(module);
        this.logger.info(`Indexing module version ${moduleSearchData.version}`);

        const must: Elastic.Match[] = [
            { match: { "namespace.raw": moduleSearchData.namespace } },
            { match: { "name.raw": moduleSearchData.name } },
            { match: { "provider.raw": moduleSearchData.provider } }
        ];

        const requestBody: Elastic.Request = { query: { bool: { must } } };

        // get any existing modules in the latest version index before we put the new version
        // we can get between 0 and 2 results - 0 (new module), 1 (existing release OR pre-release version), or 2 (existing release AND pre-release version)
        const existingCheckResp =
            await this.httpClient.post<Elastic.Results<ModuleSearchData>>(requestBody, this.getLatestVersionUrl("_search"));

        const existingRelease = existingCheckResp.data.hits.hits.find(h => !h._source.isPreRelease)?._source;
        if (existingRelease) {
            this.logger.info(`Found existing release version ${existingRelease.version}`);
        }
        const existingPreRelease = existingCheckResp.data.hits.hits.find(h => h._source.isPreRelease)?._source;
        if (existingPreRelease) {
            this.logger.info(`Found existing pre-release version ${existingPreRelease.version}`);
        }

        const isNewerThanRelease = !existingRelease || Version.compare(moduleSearchData.version, existingRelease.version) > 0;
        this.logger.info(`Current version is${!isNewerThanRelease ? " not" : ""} newer than the existing release version`);
        const isNewerThanPreRelease = isNewerThanRelease && (!existingPreRelease || Version.compare(moduleSearchData.version, existingPreRelease.version) > 0);
        this.logger.info(`Current version is${!isNewerThanPreRelease ? " not" : ""} newer than the existing pre-release version`);

        if (isNewerThanPreRelease) {
            await this.addToLatestVersionIndex(moduleSearchData);
            if (existingPreRelease) {
                await this.moveToPreviousVersionIndex(existingPreRelease);
            }
            if (!moduleSearchData.isPreRelease && existingRelease) {
                await this.moveToPreviousVersionIndex(existingRelease);
            }
        } else if (isNewerThanRelease) {
            if (!moduleSearchData.isPreRelease) {
                await this.addToLatestVersionIndex(moduleSearchData);
                if (existingRelease) {
                    await this.moveToPreviousVersionIndex(existingRelease);
                }
            } else {
                await this.addToPreviousVersionIndex(moduleSearchData);
            }
        } else {
            await this.addToPreviousVersionIndex(moduleSearchData);
        }
    }

    async searchModules(searchCriteria?: ModuleSearchCriteria): Promise<ModuleSearchResults> {
        searchCriteria = Object.assign({}, defaultModuleSearchCriteria, searchCriteria);

        const should: Elastic.Match[] = [
            ...searchCriteria.keywords.map(k => ({ match: { displayName: k } })),
            ...searchCriteria.keywords.map(k => ({ match: { description: k } }))
        ];
        const must: Elastic.Match[] = [];
        const terms: Elastic.Terms = {};

        if (!searchCriteria.namespace) {
            should.push(...searchCriteria.keywords.map(k => ({ match: { namespace: k } })))
        } else {
            must.push({ match: { "namespace.raw": searchCriteria.namespace }})
        }

        if (!searchCriteria.name) {
            should.push(...searchCriteria.keywords.map(k => ({ match: { name: k } })))
        } else {
            must.push({ match: { "name.raw": searchCriteria.name }})
        }

        if (!searchCriteria.providers || !searchCriteria.providers.length) {
            should.push(...searchCriteria.keywords.map(k => ({ match: { provider: k } })))
        } else {
            must.push({
                bool: {
                    should: searchCriteria.providers.map(provider => ({ match: { "provider.raw": provider } }))
                }
            });
        }

        must.push(getPreReleaseBoolQuery(searchCriteria.includePreRelease));
        if (should.length > 0) {
            must.push({ bool: { should } });
        }

        if (searchCriteria.tags && searchCriteria.tags.length > 0) {
            terms.tags = searchCriteria.tags;
        }

        let from = parseInt(searchCriteria.pageStartToken);
        if (isNaN(from)) {
            from = 0;
        }

        const query: Elastic.Query = { bool: { must } };
        if (Object.keys(terms).length > 0) {
            query.terms = terms;
        }

        const requestBody: Elastic.Request = {
            size: searchCriteria.pageSize ?? 25,
            from,
            query,
            sort: descendingVersionSort
        };

        this.logger.debug(`Executing search via Elasticsearch`);
        this.logger.debug(requestBody);

        const resp = await this.httpClient.post<Elastic.Results<ModuleSearchData>>(requestBody, this.getLatestVersionUrl(`_search`));

        const nextPageStart = from + requestBody.size;

        // if we are including pre-release results, and we have both an active pre-release and release version,
        // we want to take the pre-release
        let results = resp.data.hits.hits?.map(x => searchDataToModule(x._source)) ?? [];
        if (searchCriteria.includePreRelease) {
            const resultMap: { [key: string]: Module } = {};
            for (const result of results) {
                const key = `${result.namespace}/${result.name}/${result.provider}`;
                if (!resultMap[key] || resultMap[key].dateCreated < result.dateCreated) {
                    resultMap[key] = result;
                }
            }
            results = Object.values(resultMap);
        }

        return {
            results,
            totalResults: resp.data.hits.total.value,
            nextPageStartToken: nextPageStart < resp.data.hits.total.value ? nextPageStart.toString() : null
        };
    }

    async getModuleVersions(namespace: string, name: string, providers?: string[], includePreRelease = false): Promise<Module[]> {
        const must: Elastic.Match[] = [
            { match: { "namespace.raw": namespace } },
            { match: { "name.raw": name } }
        ];

        if (providers && providers.length) {
            must.push({
                bool: {
                    should: providers.map(provider => ({ match: { "provider.raw": normalizeProvider(provider) } }))
                }
            });
        }

        must.push(getPreReleaseBoolQuery(includePreRelease));

        const requestBody: Elastic.Request = {
            query: { bool: { must } },
            sort: descendingVersionSort
        };

        this.logger.debug(`Getting module versions via Elasticsearch`);
        this.logger.debug(requestBody);

        const [previousVersionsResp, latestVersionsResp] =
            await Promise.all([
                this.httpClient.post<Elastic.Results<ModuleSearchData>>(requestBody, this.getPreviousVersionUrl(`_search`)),
                this.httpClient.post<Elastic.Results<ModuleSearchData>>(requestBody, this.getLatestVersionUrl(`_search`))
            ]);

        return [
            ...latestVersionsResp.data.hits.hits?.map(x => searchDataToModule(x._source)) ?? [],
            ...previousVersionsResp.data.hits.hits?.map(x => searchDataToModule(x._source)) ?? []
        ];
    }

    async getModuleVersion(namespace: string, name: string, provider: string, version: string): Promise<Module> {
        const url = `_doc/${[namespace, name, normalizeProvider(provider), version].join(ID_DELIMITER)}`;
        const validateStatus = (status: number) => (status >= 200 && status < 300) || status === 404;

        const [previousVersionsResp, latestVersionsResp] =
            await Promise.all([
                this.httpClient.get<Elastic.Hit<ModuleSearchData>>(this.getPreviousVersionUrl(url), { validateStatus }),
                this.httpClient.get<Elastic.Hit<ModuleSearchData>>(this.getLatestVersionUrl(url), { validateStatus })
            ]);

        const result = latestVersionsResp?.data?._source ?? previousVersionsResp?.data?._source;

        return result ? searchDataToModule(result) : null;
    }
}