import { NgModule, ModuleWithProviders } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { PipCacheInterceptor } from './cache.interceptor';
import { PIP_CACHE_MODULE_CONFIG, PipCacheModuleConfig } from './cache.models';

@NgModule({
  declarations: [],
  imports: [],
  exports: []
})
export class PipCacheModule {
  static forRoot(config?: PipCacheModuleConfig): ModuleWithProviders {
    return {
      ngModule: PipCacheModule,
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: PipCacheInterceptor,
          multi: true
        },
        {
          provide: PIP_CACHE_MODULE_CONFIG,
          useValue: config
        }
      ]
    };
  }
}
