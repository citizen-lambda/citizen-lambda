/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '@services/auth.guard';
import { UniqueProgramGuard } from '@features/programs/unique-program.guard';
import { AboutComponent } from '@components/about/about.component';

const appRoutes: Routes = [
  {
    path: 'home',
    loadChildren: (): Promise<any> => import('@features/home/home.module').then(m => m.HomeModule),
    canActivate: [UniqueProgramGuard]
  },
  { path: 'about', component: AboutComponent },
  {
    path: 'mydashboard',
    loadChildren: (): Promise<any> =>
      import('@features/user-dashboard/user-dashboard.module').then(m => m.UserDashboardModule),
    canActivate: [AuthGuard],
    canLoad: [AuthGuard]
  },
  {
    path: 'api/admin',
    loadChildren: (): Promise<any> =>
      import('@features/admin/admin.module').then(m => m.AdminModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'programs',
    loadChildren: (): Promise<any> =>
      import('@features/programs/programs.module').then(m => m.ProgramsModule)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    loadChildren: (): Promise<any> =>
      import('@features/page-not-found/page-not-found.module').then(m => m.PageNotFoundModule)
  }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
  initialNavigation: 'enabled',
  useHash: false,
  // enableTracing: true,
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
  scrollOffset: [0, 65] // TODO: source from conf: router-outlet height
});
