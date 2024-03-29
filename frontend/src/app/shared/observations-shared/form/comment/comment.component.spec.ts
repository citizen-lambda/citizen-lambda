import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { CommentComponent } from './comment.component';

describe('CommentComponent', () => {
  let component: CommentComponent;
  let fixture: ComponentFixture<CommentComponent>;

  const formBuilder: FormBuilder = new FormBuilder();

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [ReactiveFormsModule],
        declarations: [CommentComponent],
        providers: [{ provide: FormBuilder, useValue: formBuilder }]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentComponent);
    component = fixture.componentInstance;
    component.parentForm = formBuilder.group({
      someName: null
    });
    fixture.detectChanges();
  });

  it(
    'should create',
    waitForAsync(() => {
      fixture.whenStable().then(() => {
        expect(component).toBeTruthy();
      });
    })
  );
});
