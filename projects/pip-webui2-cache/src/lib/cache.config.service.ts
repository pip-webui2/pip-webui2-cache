import { Injectable, Optional, Inject } from '@angular/core';
import { defaultsDeep, get } from 'lodash';

import { PIP_CACHE_MODULE_CONFIG, PipCacheModuleConfig } from './cache.models';

@Injectable({
    providedIn: 'root'
})
export class PipCacheConfigService {

    private defaultConfig: PipCacheModuleConfig = {
        enableLogs: false,
        prefix: 'PipCache'
    };

    constructor(
        @Optional() @Inject(PIP_CACHE_MODULE_CONFIG) private injectedConfig: PipCacheModuleConfig,
    ) { }

    public get config(): PipCacheModuleConfig {
        return defaultsDeep({}, this.injectedConfig, this.defaultConfig);
    }

    public get(path: string | string[], defaultValue?: any): any {
        return get(this.config, path, defaultValue);
    }
}
