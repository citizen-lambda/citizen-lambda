import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgramsComponent } from './programs.component';
describe('ProgramsComponent', () => {
  let component: ProgramsComponent;
  let fixture: ComponentFixture<ProgramsComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramsComponent]
    });
    fixture = TestBed.createComponent(ProgramsComponent);
    component = fixture.componentInstance;
  });
  it('can load instance', () => {
    expect(component).toBeTruthy();
  });
});
