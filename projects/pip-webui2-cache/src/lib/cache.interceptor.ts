import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';

import { PipCacheService } from './cache.service';
import { tap, switchMap } from 'rxjs/operators';
import { PipCacheCollectionParams } from './cache.models';

@Injectable()
export class PipCacheInterceptor implements HttpInterceptor {

    constructor(
        private cacheService: PipCacheService
    ) { }

    private getParamsDefault(params: HttpParams): PipCacheCollectionParams {
        const ret: PipCacheCollectionParams = {};
        if (params) {
            if (params.has('offset')) { ret.offset = parseInt(params.get('offset'), 10); }
            if (params.has('limit')) { ret.limit = parseInt(params.get('limit'), 10); }
        }
        return ret;
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        for (const model of this.cacheService.models) {
            for (const ik of Object.keys(model.interceptors)) {
                const interceptor = model.interceptors[ik];
                const match = interceptor.match.exec(req.url);
                if (match) {
                    switch (req.method) {
                        case 'GET':
                            switch (ik) {
                                case 'item':
                                    const { groups } = match;
                                    return from(this.cacheService.getItem(model.name, interceptor.getKey(groups), interceptor.options)).pipe(
                                        switchMap(item => {
                                            if (!item) {
                                                return next.handle(req).pipe(
                                                    tap(e => {
                                                        if (e.type === HttpEventType.Response) {
                                                            this.cacheService.setItem(model.name, e.body, interceptor.options);
                                                        }
                                                    })
                                                );
                                            } else {
                                                return of(new HttpResponse({ body: item }));
                                            }
                                        })
                                    );
                                case 'collection':
                                    const params = interceptor.getParams ? interceptor.getParams(req.params) : this.getParamsDefault(req.params);
                                    return from(this.cacheService.getItems(model.name, params, interceptor.options)).pipe(
                                        switchMap(items => {
                                            if (!items) {
                                                return next.handle(req).pipe(
                                                    tap(e => {
                                                        if (e.type === HttpEventType.Response) {
                                                            const its = interceptor.responseModify
                                                                ? interceptor.responseModify.responseToItems(e.body) : e.body;
                                                            this.cacheService.setItems(model.name, its,
                                                                { params, options: interceptor.options });
                                                        }
                                                    })
                                                );
                                            } else {
                                                const resp = interceptor.responseModify
                                                    ? interceptor.responseModify.itemsToResponse(items) : items;
                                                return of(new HttpResponse({ body: resp }));
                                            }
                                        })
                                    );
                                default:
                                    console.error(`Unknown type of interceptor (${ik})`);
                                    return next.handle(req);
                            }
                        case 'POST':
                        case 'PUT':
                            switch (ik) {
                                case 'item':
                                case 'collection':
                                    return next.handle(req).pipe(
                                        tap(e => {
                                            if (e.type === HttpEventType.Response) {
                                                this.cacheService.setItem(model.name, e.body, { removeTotal: req.method === 'POST' });
                                            }
                                        })
                                    );
                                default:
                                    return next.handle(req);
                            }
                        case 'DELETE':
                            switch (ik) {
                                case 'item':
                                    const { groups } = match;
                                    return next.handle(req).pipe(
                                        tap(e => {
                                            if (e.type === HttpEventType.Response) {
                                                this.cacheService.deleteItems(model.name, [interceptor.getKey(groups)]);
                                            }
                                        })
                                    );
                                default:
                                    return next.handle(req);
                            }
                        default:
                            return next.handle(req);
                    }
                }
            }
        }
        return next.handle(req);
    }
}
