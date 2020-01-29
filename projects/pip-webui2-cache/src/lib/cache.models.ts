import { InjectionToken } from '@angular/core';
import { HttpParams } from '@angular/common/http';

export class PipCachePaginationParams {
    offset?: number;
    limit?: number;
}

export function extractPaginationDefault(params: HttpParams): [PipCachePaginationParams, HttpParams] {
    const res = new PipCachePaginationParams();
    if (params) {
        if (params.has('limit')) {
            res.limit = parseInt(params.get('limit'), 10);
            params = params.delete('limit');
        }
        if (params.has('offset')) {
            res.offset = parseInt(params.get('offset'), 10);
            params = params.delete('offset');
        }
    }
    return [res, params];
}

export class PipCacheInterceptorOptions {
    maxAge?: number;
}

export class PipCacheInterceptorSettings {
    match: RegExp;
    options?: PipCacheInterceptorOptions;
}

export class PipCacheInterceptorItemSettings extends PipCacheInterceptorSettings {
    getKey: (groups: any) => any;
}

export class PipCacheInterceptorCollectionSettings extends PipCacheInterceptorSettings {
    responseModify?: {
        responseToItems: (resp: any) => any[];
        itemsToResponse: (items: any[]) => any;
    };
    extractPagination?: (params: HttpParams) => PipCachePaginationParams;
}

export class PipCacheModel {
    name: string;
    options: {
        maxAge: number;
        key?: string;
    };
    interceptors: {
        item?: PipCacheInterceptorItemSettings;
        collection?: PipCacheInterceptorCollectionSettings;
    };
}

export const PIP_CACHE_MODEL = new InjectionToken<PipCacheModel>('PipCache model');

export class PipCacheModuleConfig {
    enableLogs?: boolean;
    prefix?: string;
}

export const PIP_CACHE_MODULE_CONFIG = new InjectionToken<PipCacheModuleConfig>('PipCacheModule configuration');

