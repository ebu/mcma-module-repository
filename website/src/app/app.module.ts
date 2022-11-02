import { NgModule } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HeaderComponent, FooterComponent } from './layout';
import { SearchComponent, LandingComponent } from './routes';
import { SearchBarComponent, SearchResultComponent } from './common';
import { ApiClient } from "./api";

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    SearchComponent,
    LandingComponent,
    SearchBarComponent,
    SearchResultComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FontAwesomeModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [
    ApiClient
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
