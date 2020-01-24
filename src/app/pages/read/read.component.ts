import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { PhotosDataService } from 'src/app/services';

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
    private fb: FormBuilder,
    private photosDs: PhotosDataService
  ) {
    this.form = this.fb.group({
      page: [1],
      limit: [10],
      item: [1],
      cache: [true]
    });
  }

  public get resultJson(): string { return JSON.stringify(this.result, null, 2); }

  readAllPhotos() {
    const t0 = performance.now();
    const v = this.form.value;
    this.photosDs.getPhotos({ cache: v.cache }).toPromise().then(res => {
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
    this.photosDs.getPhotos({ cache: v.cache }, { page: v.page, take: v.limit }).toPromise().then(res => {
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
    this.photosDs.getPhoto(v.item, { cache: v.cache }).toPromise().then(res => {
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
