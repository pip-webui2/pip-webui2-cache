import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { PhotosDataService } from '../../services';

@Component({
  selector: 'pip-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {

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
      albumId: [],
      title: [],
      url: [],
      thumbnailUrl: []
    });
  }

  public get resultJson(): string { return JSON.stringify(this.result, null, 2); }

  createPhoto() {
    const t0 = performance.now();
    this.photosDs.createPhoto(this.form.value).toPromise().then(res => {
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
