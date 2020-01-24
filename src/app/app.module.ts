import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PipCacheModule, PIP_CACHE_MODEL, PipCacheModel, PipCacheCollectionParams } from 'pip-webui2-cache';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppMaterialModule } from './material.module';
import { PhotosDataService } from './services';
import { PagesModule } from './pages/pages.module';
import { DialogsModule } from './dialogs/dialogs.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    PipCacheModule.forRoot({ enableLogs: true }),

    AppRoutingModule,
    DialogsModule,
    PagesModule,
    AppMaterialModule
  ],
  providers: [
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
            match: /photos\/(?<id>[^ $\/]*)/,
            getKey: (groups: any) => groups.id
          },
          collection: {
            match: /photos/,
            getParams: params => {
              const res: PipCacheCollectionParams = {};
              if (params.has('p') && params.has('l')) {
                res.limit = parseInt(params.get('l'), 10);
                res.offset = (parseInt(params.get('p'), 10) - 1) * res.limit;
              }
              return res;
            }
          }
        }
      } as PipCacheModel,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
