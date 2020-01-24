import { HttpParams } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export class PipCacheCollectionParams {
    offset?: number;
    limit?: number;
}

export class PipCacheInterceptorOptions {
    maxAge?: number;
}

export class PipCacheModel {
    name: string;
    options: {
        maxAge: number;
        key?: string;
    };
    interceptors: {
        item?: {
            match: RegExp;
            options?: PipCacheInterceptorOptions;
            getKey: (groups: any) => any;
        };
        collection?: {
            match: RegExp;
            options?: PipCacheInterceptorOptions;
            responseModify?: {
                responseToItems: (resp: any) => any[];
                itemsToResponse: (items: any[]) => any;
            }
            getParams?: (params: HttpParams) => PipCacheCollectionParams;
        };
    };
}

export const PIP_CACHE_MODEL = new InjectionToken<PipCacheModel>('PipCache model');

export class PipCacheModuleConfig {
    enableLogs?: boolean;
    prefix?: string;
}

export const PIP_CACHE_MODULE_CONFIG = new InjectionToken<PipCacheModuleConfig>('PipCacheModule configuration');

