import { Component } from '@angular/core'
import { Router } from "@angular/router";
import { ModuleSearchParams } from "../../api";

@Component({
  selector: 'mcma-landing',
  templateUrl: './landing.component.html',
  styleUrls: [ './landing.component.scss' ]
})
export class LandingComponent {
  constructor(private router: Router) {
  }

  goToSearch(params: ModuleSearchParams): void {
    this.router.navigate([ "/search" ], { queryParams: params });
  }
}
