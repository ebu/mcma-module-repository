import type { ModuleSearchParams, ModuleSearchResults } from "./model";
import type { Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

export const ApiUrl = "https://modules.mcma.io/api";

@Injectable()
export class ApiClient {
  constructor(private httpClient: HttpClient) {
  }

  search(params: ModuleSearchParams): Observable<ModuleSearchResults> {
    const httpParams = new HttpParams();
    httpParams.append("q", params.q);
    httpParams.append("includePreRelease", params.includePreRelease?.toString() ?? false);
    
    if (params.namespace) {
      httpParams.append("q", params.namespace);
    }
    
    return this.httpClient.get<ModuleSearchResults>(`${ApiUrl}/modules`, { params: httpParams });
  }
}
