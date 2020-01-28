import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { PhotosDataService, AppService } from '../../services';

@Component({
  selector: 'pip-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateComponent {

  public idCtrl = new FormControl('', Validators.required);
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
    this.app.breadcrumb = 'Update';
    this.form = this.fb.group({
      id: [null, Validators.required],
      albumId: [],
      title: [],
      url: [],
      thumbnailUrl: []
    });
  }

  readPhoto() {
    const t0 = performance.now();
    const v = this.form.value;
    this.photosDs.getPhoto(this.idCtrl.value, { cache: this.app.cacheEnabled }).toPromise().then(res => {
      const t1 = performance.now();
      this.form.patchValue(res);
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: res
      };
    }, err => {
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: err
      };
    });
  }

  savePhoto() {
    const t0 = performance.now();
    const v = this.form.value;
    this.photosDs.updatePhoto(v.id, v, { cache: this.app.cacheEnabled }).toPromise().then(res => {
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: res
      };
    }, err => {
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: err
      };
    });
  }

}
