import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthCallbackComponent, LandingComponent, LoginComponent, SearchComponent } from './routes';

const routes: Routes = [
  {
    component: SearchComponent,
    path: 'search'
  },
  {
    component: AuthCallbackComponent,
    path: 'auth-callback'
  },
  {
    component: LoginComponent,
    path: 'login'
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
