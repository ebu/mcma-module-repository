import { NgModule } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigInitializer, ConfigService } from "./config.service";

import { ApiClient } from "./api";
import { SearchBarComponent, SearchResultComponent, SessionStorageService, UserService } from './common';
import { FooterComponent, HeaderComponent } from './layout';
import { AuthCallbackComponent, LandingComponent, LoginComponent, SearchComponent } from './routes';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    SearchComponent,
    LandingComponent,
    SearchBarComponent,
    SearchResultComponent,
    AuthCallbackComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FontAwesomeModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [
    ApiClient,
    ConfigService,
    SessionStorageService,
    UserService,
    ConfigInitializer
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
