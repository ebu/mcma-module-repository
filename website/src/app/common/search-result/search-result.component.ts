import type { Module } from "../../api";
import { Component, Input } from '@angular/core';

@Component({
  selector: 'mcma-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: [ './search-result.component.scss' ]
})
export class SearchResultComponent {
  @Input() module: Module | null = null;
}
