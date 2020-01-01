import { LOCALE_ID, NgModule, Inject, ApplicationRef, DoBootstrap } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';

import { ProgramsModule } from './features/programs/programs.module';
import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './services/auth.interceptor';
import { LoginComponent } from './components/login/login.component';
import { LogoutComponent } from './components/logout/logout.component';
import { RegisterComponent } from './components/register/register.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { SpeciesComponent } from './components/species/species.component';
import { GncService } from './services/gnc.service';
import { GncProgramsService } from './features/programs/gnc-programs.service';
import { ProgramsResolve } from './features/programs/programs-resolve.service';
import { TaxonomyService } from './services/taxonomy.service';
import { ErrorHandler } from './services/error_handler';
import { AboutComponent } from './components/about/about.component';
import { AboutCustomComponent } from './components/about/custom/custom.component';
import { AboutFixedComponent } from './components/about/fixed/fixed.component';

import { AppConfig } from '../conf/app.config';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    NgbModule,
    LoadingBarHttpClientModule,
    LoadingBarRouterModule,
    LoadingBarModule,
    ProgramsModule,
    routing
  ],
  declarations: [
    AppComponent,
    SidebarComponent,
    FooterComponent,
    TopbarComponent,
    LoginComponent,
    LogoutComponent,
    RegisterComponent,
    SpeciesComponent,
    AboutComponent,
    AboutCustomComponent,
    AboutFixedComponent
  ],
  entryComponents: [AppComponent, LoginComponent, LogoutComponent, RegisterComponent, SidebarComponent],
  providers: [
    AuthService,
    GncService,
    GncProgramsService,
    TaxonomyService,
    ErrorHandler,
    ProgramsResolve,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule  implements DoBootstrap {
  constructor(@Inject(LOCALE_ID) localeId: string) {
    console.info(`Locale: ${localeId}.`);
  }

  public ngDoBootstrap(app: ApplicationRef): void {
    app.bootstrap(AppComponent);
  }
}
