import { Component } from '@angular/core';
import { BehaviorSubject, catchError, map, tap } from "rxjs";
import { ApiClient, groupResults, Module, ModuleSearchParams, ModuleSearchResults } from "../../api";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'mcma-search',
  templateUrl: './search.component.html',
  styleUrls: [ './search.component.scss' ]
})
export class SearchComponent {
  private isSearchingSource = new BehaviorSubject<boolean>(false);
  private resultsSource = new BehaviorSubject<Module[]>([]);
  private errorSource = new BehaviorSubject<any>(null);

  initialQuery: string;
  initialIncludePreRelease: boolean;

  isSearching$ = this.isSearchingSource.asObservable();
  results$ = this.resultsSource.asObservable();
  hasResults$ = this.results$.pipe(map(x => !!x && x.length > 0));
  error$ = this.errorSource.asObservable();

  constructor(private apiClient: ApiClient, private router: Router, private route: ActivatedRoute) {
    this.initialQuery = this.route.snapshot.queryParams["q"];
    this.initialIncludePreRelease = this.route.snapshot.queryParams["includePreRelease"];
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(
      map(p => new ModuleSearchParams(p["q"], p["includePreRelease"]))
    ).subscribe(params => {
      this.executeSearch(params);
    });
  }

  updateSearch(params: ModuleSearchParams): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params
    });
  }

  private executeSearch(params: ModuleSearchParams): void {
    this.isSearchingSource.next(true);

    this.apiClient.search(params)
      .pipe(
        catchError(error => {
          this.isSearchingSource.next(false);
          this.errorSource.next(typeof error === 'string' ? error : JSON.stringify(error, null, 2));
          throw error;
        }),
        map((x: ModuleSearchResults) => groupResults(x.results)),
        tap(() => this.isSearchingSource.next(false))
      )
      .subscribe(x => {
        this.resultsSource.next(x);
      });
  }
}
