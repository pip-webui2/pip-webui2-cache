import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { PhotosDataService, AppService } from 'src/app/services';

@Component({
  selector: 'pip-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.scss']
})
export class ReadComponent {

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
    this.app.breadcrumb = 'Read';
    this.form = this.fb.group({
      page: [1],
      limit: [10],
      item: [1]
    });
  }

  readAllPhotos() {
    const t0 = performance.now();
    const v = this.form.value;
    this.photosDs.getPhotos({ cache: this.app.cacheEnabled }).toPromise().then(res => {
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: res
      };
    });
  }

  readPhotos() {
    const t0 = performance.now();
    const v = this.form.value;
    this.photosDs.getPhotos({ cache: this.app.cacheEnabled }, { page: v.page, take: v.limit }).toPromise().then(res => {
      const t1 = performance.now();
      this.result = {
        time: (t1 - t0).toFixed(2) + 'ms',
        item: res
      };
    });
  }

  readPhoto() {
    const t0 = performance.now();
    const v = this.form.value;
    this.photosDs.getPhoto(v.item, { cache: this.app.cacheEnabled }).toPromise().then(res => {
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
