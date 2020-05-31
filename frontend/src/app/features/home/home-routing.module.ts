import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsResolve } from '@features/programs/services/programs-resolve.service';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    resolve: { programs: ProgramsResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
