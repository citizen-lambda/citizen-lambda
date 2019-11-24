import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './services/auth.guard';
import { UniqueProgramGuard } from './features/programs/unique-program.guard';
import { AboutComponent } from './components/about/about.component';
import { SpeciesComponent } from './components/species/species.component';

const appRoutes: Routes = [
  {
    path: 'home',
    loadChildren: './features/home/home.module#HomeModule',
    canActivate: [UniqueProgramGuard]
  },
  { path: 'about', component: AboutComponent },
  {
    path: 'mydashboard',
    loadChildren: './features/user-dashboard/user-dashboard.module#UserDashboardModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'api/admin',
    loadChildren: './features/admin/admin.module#AdminModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'programs',
    // loadChildren: () => import('./programs/programs.module').then(m => m.ProgramsModule),
    loadChildren: './features/programs/programs.module#ProgramsModule'
  },
  { path: 'taxon/:id', component: SpeciesComponent },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { path: '**', loadChildren: './shared/page-not-found/page-not-found.module#PageNotFoundModule' }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
  initialNavigation: 'enabled',
  useHash: false,
  // enableTracing: true,
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
  scrollOffset: [0, 65] // TODO: source from conf: router-outlet height
});
