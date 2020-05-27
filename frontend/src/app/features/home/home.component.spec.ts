import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ProgramsService } from '../programs/programs.service';
import { HomeCustomComponent } from './custom/custom.component';
import { HomeComponent } from './home.component';
import { GreeterModule } from '@shared/greeter/greeter.module';
import { ProgramsSharedModule } from '@shared/programs-shared/programs-shared.module';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent, HomeCustomComponent],
      providers: [ProgramsService],
      imports: [RouterTestingModule, GreeterModule, ProgramsSharedModule]
    }).compileComponents();
  }));

  it('should create', () => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
