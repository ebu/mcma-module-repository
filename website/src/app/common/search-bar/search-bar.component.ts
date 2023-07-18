import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from "@angular/forms";
import { map, Subject } from "rxjs";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { ModuleSearchParams } from "../../api";

@Component({
  selector: 'mcma-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: [ './search-bar.component.scss' ]
})
export class SearchBarComponent implements AfterViewInit {
  private _query = "";
  private _includePreRelease = false;
  private submitSubject = new Subject<void>();

  faSearch = faSearch;

  queryControl = new FormControl("");
  includePreReleaseControl = new FormControl(false);

  form = new FormGroup({
    query: this.queryControl,
    includePreRelease: this.includePreReleaseControl
  });

  @Input() set query(val: string) {
    this._query = val;
    if (this.queryControl) {
      this.queryControl.setValue(val);
    }
  }

  @Input() set includePreRelease(val: boolean) {
    this._includePreRelease = val;
    if (this._includePreRelease) {
      this.includePreReleaseControl.setValue(val);
    }
  }

  @Output() resultsRequested: EventEmitter<ModuleSearchParams> = new EventEmitter();

  constructor() {
    this.submitSubject.asObservable()
      .pipe(
        map(() => new ModuleSearchParams(this.queryControl.value ?? "", undefined, undefined, undefined, this.includePreReleaseControl.value ?? false))
      )
      .subscribe(this.resultsRequested);
  }

  ngAfterViewInit(): void {
    this.queryControl.setValue(this._query);
  }

  handleSubmit(e: Event): void {
    e.preventDefault();
    this.submitSubject.next();
  }
}
