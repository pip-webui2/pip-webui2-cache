import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { PhotosDataService, AppService } from '../../services';

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
    private app: AppService,
    private fb: FormBuilder,
    private photosDs: PhotosDataService
  ) {
    this.app.breadcrumb = 'Delete';
    this.form = this.fb.group({
      id: [null, Validators.required],
    });
  }

  deletePhoto() {
    this.error = false;
    const t0 = performance.now();
    this.photosDs.deletePhoto(this.form.value.id, { cache: this.app.cacheEnabled }).toPromise().then(res => {
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
