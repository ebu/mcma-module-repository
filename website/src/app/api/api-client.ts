import type { ModuleSearchParams, ModuleSearchResults } from "./model";
import type { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

export const ApiUrl = "https://modules.mcma.io/api";

@Injectable()
export class ApiClient {
  constructor(private httpClient: HttpClient) {
  }

  search(params: ModuleSearchParams): Observable<ModuleSearchResults> {
    return this.httpClient.get<ModuleSearchResults>(`${ApiUrl}/modules`, {
      params: {
        q: params.q,
        includePreRelease: params.includePreRelease?.toString() ?? false
      }
    });
  }
}
