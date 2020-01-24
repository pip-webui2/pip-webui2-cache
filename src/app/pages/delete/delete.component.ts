import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { PhotosDataService } from '../../services';

@Component({
  selector: 'pip-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss']
})
export class DeleteComponent {

  public error = false;
  public form: FormGroup;
  public result = {
    time: '',
    item: null
  };

  constructor(
    private fb: FormBuilder,
    private photosDs: PhotosDataService
  ) {
    this.form = this.fb.group({
      id: [null, Validators.required],
    });
  }

  public get resultJson(): string { return JSON.stringify(this.result, null, 2); }

  deletePhoto() {
    this.error = false;
    const t0 = performance.now();
    this.photosDs.deletePhoto(this.form.value.id).toPromise().then(res => {
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: res
      };
    }, err => {
      this.error = true;
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: err
      };
    });
  }
}
