import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramTeaserComponent } from './program-teaser.component';

describe('ProgramTeaserComponent', () => {
  let component: ProgramTeaserComponent;
  let fixture: ComponentFixture<ProgramTeaserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramTeaserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramTeaserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
