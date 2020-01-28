import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { pickBy, identity } from 'lodash';

import { Photo } from '../../models';
import { PhotosDataService, AppService } from '../../services';

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
    private app: AppService,
    private fb: FormBuilder,
    private photosDs: PhotosDataService
  ) {
    this.app.breadcrumb = 'Create';
    this.form = this.fb.group({
      albumId: [],
      title: [],
      url: [],
      thumbnailUrl: []
    });
  }

  createPhoto() {
    const t0 = performance.now();
    this.photosDs.createPhoto(pickBy(this.form.value, identity) as Photo, { cache: this.app.cacheEnabled }).toPromise().then(res => {
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
