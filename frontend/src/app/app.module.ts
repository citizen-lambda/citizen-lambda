import { LOCALE_ID, NgModule, Inject } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';

import { ProgramsModule } from './programs/programs.module';
import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AuthService } from './auth/auth.service';
import { AuthInterceptor } from './auth/auth.interceptor';
import { LoginComponent } from './auth/login/login.component';
import { LogoutComponent } from './auth/logout/logout.component';
import { RegisterComponent } from './auth/register/register.component';
import { FooterComponent } from './core/footer/footer.component';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { TopbarComponent } from './core/topbar/topbar.component';
import { SpeciesComponent } from './synthesis/species/species.component';
import { GncService } from './api/gnc.service';
import { GncProgramsService } from './api/gnc-programs.service';
import { ProgramsResolve } from './programs/programs-resolve.service';
// import { TaxonomyService } from './api/taxonomy.service';
import { ErrorHandler } from './api/error_handler';
import { AboutComponent } from './about/about.component';
import { AboutCustomComponent } from './about/custom/custom.component';
import { AboutFixedComponent } from './about/fixed/fixed.component';

import { AppConfig } from '../conf/app.config';



// fixed with next ng-bootstrap version, remove after upgrade
// TODO: ngbModule augmentation: test whether we need to patch node_modules
declare module '@ng-bootstrap/ng-bootstrap' {
  export interface NgbModalOptions {
    size?: 'sm' | 'lg' | 'xl';
    centered?: boolean;
  }
}

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
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
    AboutFixedComponent,
  ],
  entryComponents: [
    LoginComponent,
    LogoutComponent,
    RegisterComponent,
    SidebarComponent,
  ],
  providers: [
    AuthService,
    GncService,
    GncProgramsService,
    ErrorHandler,
    ProgramsResolve,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: LOCALE_ID, useValue: 'fr' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(@Inject(LOCALE_ID) localeId: string) {
    this.localeInitializer(localeId).then(() => {
      console.info(`Locale: ${localeId}.`);
    });
  }

  async localeInitializer(localeId: string): Promise<any> {
    try {
      const module = await import(
        /* webpackInclude: /(fr|en)\.js$/ */
        `@angular/common/locales/${localeId}.js`
      );
      return registerLocaleData(module.default);
    } catch {
      registerLocaleData(localeFr, 'fr');
    }
  }
}
