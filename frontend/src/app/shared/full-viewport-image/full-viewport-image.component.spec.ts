import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { FullViewportImageComponent } from './full-viewport-image.component';

describe('FullViewportImageComponent', () => {
  let component: FullViewportImageComponent;
  let fixture: ComponentFixture<FullViewportImageComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FullViewportImageComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FullViewportImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
