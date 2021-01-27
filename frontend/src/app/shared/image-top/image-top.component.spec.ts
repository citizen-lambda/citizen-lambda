import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageTopComponent } from './image-top.component';
import { FullViewportImageModule } from '@shared/full-viewport-image/full-viewport-image.module';

describe('ImageTopComponent', () => {
  let component: ImageTopComponent;
  let fixture: ComponentFixture<ImageTopComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [FullViewportImageModule],
        declarations: [ImageTopComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
