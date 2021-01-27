import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  OnInit
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-comment',
  templateUrl: './comment.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentComponent implements OnInit {
  @Input() parentForm: FormGroup | undefined;
  @Input() default: string | undefined;
  comment: FormControl;

  constructor() {
    this.comment = new FormControl(this.default);
  }

  ngOnInit(): void {
    if (this.default) {
      this.comment.setValue(this.default);
    }
    this.parentForm?.addControl('comment', this.comment);
  }
}
