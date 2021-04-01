import { Authenticator, HttpClient, HttpClientConfig } from "@mcma/client";
import { Module } from "./module";

function getUrl(options: McmaElasticSearchClientOptions, path: string) {
    return `${options.endpoint}/${options.index}/${path}`;
}

export interface McmaElasticSearchClientOptions<T = any> {
    endpoint: string;
    index: string;
    authenticator?: Authenticator;
    httpClientConfig?: HttpClientConfig;
}

export interface McmaModuleSearchResults {
    results: Module[];
    nextPageStartToken: string;
}

export class McmaModuleSearchClient {
    private readonly httpClient: HttpClient;

    constructor(private options: McmaElasticSearchClientOptions) {
        this.httpClient = new HttpClient(this.options.authenticator, this.options.httpClientConfig);
    }

    async index(id: string, body: Module): Promise<void> {
        await this.httpClient.put(body, getUrl(this.options, `_doc/${id.replace(/\//g, "-")}`));
    }

    async search(keywords: string[]): Promise<McmaModuleSearchResults> {
        const searchBody = {
            query: {
                bool: {
                    should: [
                        ...keywords.map(k => ({ match: { namespace: k } })),
                        ...keywords.map(k => ({ match: { name: k } })),
                        ...keywords.map(k => ({ match: { displayName: k } })),
                        ...keywords.map(k => ({ match: { description: k } }))
                    ]
                }
            }
        };

        const resp = await this.httpClient.post<any>(searchBody, getUrl(this.options, `_search`));

        return {
            results: resp.data.hits?.hits?.map((x: { _source: Module }) => x._source) ?? [],
            nextPageStartToken: resp.data._scroll_id
        };
    }
}