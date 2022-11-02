import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SearchComponent, LandingComponent } from './routes';

const routes: Routes = [
  {
    component: SearchComponent,
    path: 'search'
  },
  {
    component: LandingComponent,
    path: ''
  }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {
}
