import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageTopComponent } from './image-top.component';

describe('ImageTopComponent', () => {
  let component: ImageTopComponent;
  let fixture: ComponentFixture<ImageTopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageTopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
