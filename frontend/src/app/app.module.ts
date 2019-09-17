import { LOCALE_ID, NgModule, Inject } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import { ScrollingModule } from '@angular/cdk-experimental/scrolling';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { GreeterModule } from './shared/greeter/greeter.module';

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
import { HomeComponent } from './home/home.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { DescModalComponent } from './programs/desc-modal/desc-modal.component';
import { ProgramsComponent } from './programs/programs.component';

import { UserDashboardComponent } from './auth/user-dashboard/user-dashboard.component';
import { SpeciesComponent } from './synthesis/species/species.component';
import { GncService } from './api/gnc.service';
import { GncProgramsService } from './api/gnc-programs.service';
// import { TaxhubService } from './api/taxhub.service';
import { ErrorHandler } from './api/error_handler';
import { AboutComponent } from './about/about.component';
import { AboutCustomComponent } from './about/custom/custom.component';
import { AboutFixedComponent } from './about/fixed/fixed.component';
import { HomeCustomComponent } from './home/custom/custom.component';
import { ProgramsResolve } from './programs/programs-resolve.service';
import { AdminComponent } from './auth/admin/admin.component';

import { AppConfig } from '../conf/app.config';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ScrollingModule,
    NgbModule,
    GreeterModule,
    routing
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    HomeCustomComponent,
    ProgramsComponent,
    PageNotFoundComponent,
    DescModalComponent,
    SidebarComponent,
    FooterComponent,
    TopbarComponent,
    LoginComponent,
    LogoutComponent,
    RegisterComponent,
    UserDashboardComponent,
    SpeciesComponent,
    AboutComponent,
    AboutCustomComponent,
    AboutFixedComponent,
    AdminComponent,
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
  bootstrap: [AppComponent],
  entryComponents: [
    DescModalComponent,
    LoginComponent,
    LogoutComponent,
    RegisterComponent
  ],
  exports: [
    AdminComponent,
  ]
})
export class AppModule {
  constructor(@Inject(LOCALE_ID) localeId: string) {
    this.localeInitializer(localeId).then(() => {
      console.info(`Locale: ${localeId}.`);
    });
  }

  async localeInitializer(localeId: string): Promise<any> {
    const module = await import(
      /* webpackInclude: /(fr|en)\.js$/ */
      `@angular/common/locales/${localeId}.js`
    );
    return registerLocaleData(module.default);
  }
}
