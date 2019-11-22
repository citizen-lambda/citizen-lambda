import { AboutComponent } from './about/about.component';
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './auth/auth.guard';
import { UniqueProgramGuard } from './programs/unique-program.guard';
import { SpeciesComponent } from './synthesis/species/species.component';

const appRoutes: Routes = [
  {
    path: 'home',
    loadChildren: './home/home.module#HomeModule',
    canActivate: [UniqueProgramGuard]
  },
  { path: 'about', component: AboutComponent },
  {
    path: 'mydashboard',
    loadChildren: './auth/user-dashboard/user-dashboard.module#UserDashboardModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'api/admin',
    loadChildren: './auth/admin/admin.module#AdminModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'programs',
    // loadChildren: () => import('./programs/programs.module').then(m => m.ProgramsModule),
    loadChildren: './programs/programs.module#ProgramsModule',
  },
  { path: 'synthesis/species/:id', component: SpeciesComponent },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { path: '**', loadChildren: './page-not-found/page-not-found.module#PageNotFoundModule' }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
  initialNavigation: 'enabled',
  useHash: false,
  // enableTracing: true,
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
  scrollOffset: [0, 65] // TODO: source from conf: router-outlet height
});
