import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';

import { PipCacheService } from './cache.service';
import { tap, switchMap } from 'rxjs/operators';
import { PipCachePaginationParams } from './cache.models';

@Injectable()
export class PipCacheInterceptor implements HttpInterceptor {

    constructor(
        private cacheService: PipCacheService
    ) { }

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
                                    return from(this.cacheService.getItem(model.name, interceptor.getKey(match), interceptor.options))
                                        .pipe(
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
                                    return from(this.cacheService.getItems(model.name, {
                                        httpParams: req.params,
                                        interceptor
                                    })).pipe(
                                        switchMap(items => {
                                            if (!items) {
                                                return next.handle(req).pipe(
                                                    tap(e => {
                                                        if (e.type === HttpEventType.Response) {
                                                            const its = interceptor.responseModify
                                                                ? interceptor.responseModify.responseToItems(e.body) : e.body;
                                                            this.cacheService.setItems(model.name, its, {
                                                                httpParams: req.params,
                                                                interceptor
                                                            });
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
                                    return next.handle(req).pipe(
                                        tap(e => {
                                            if (e.type === HttpEventType.Response) {
                                                this.cacheService.deleteItems(model.name, [interceptor.getKey(match)]);
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
