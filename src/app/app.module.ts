import { NgModule } from '@angular/core';
import { HttpClientModule, HttpParams } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PipCacheModule, PIP_CACHE_MODEL, PipCacheModel, PipCacheCollectionParams } from 'pip-webui2-cache';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppMaterialModule } from './material.module';
import { PhotosDataService, AppService } from './services';
import { PagesModule } from './pages/pages.module';
import { DialogsModule } from './dialogs/dialogs.module';

export function getPhotosKey(groups: any) { return groups && groups.id; }
export function getPhotosParams(params: HttpParams): PipCacheCollectionParams {
  const res: PipCacheCollectionParams = {};
  if (params.has('p') && params.has('l')) {
    res.limit = parseInt(params.get('l'), 10);
    res.offset = (parseInt(params.get('p'), 10) - 1) * res.limit;
  }
  return res;
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PipCacheModule.forRoot({ enableLogs: true }),

    AppRoutingModule,
    DialogsModule,
    PagesModule,
    AppMaterialModule
  ],
  providers: [
    AppService,
    PhotosDataService,
    {
      provide: PIP_CACHE_MODEL,
      useValue: {
        name: 'photos',
        options: {
          maxAge: 1000 * 60 * 2,
          key: 'id'
        },
        interceptors: {
          item: {
            match: new RegExp('photos\/(?<id>[^ $\/]*)'),
            getKey: getPhotosKey
          },
          collection: {
            match: new RegExp('photos'),
            getParams: getPhotosParams
          }
        }
      } as PipCacheModel,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
