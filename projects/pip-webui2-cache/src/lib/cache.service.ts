import { Injectable, Optional, Inject } from '@angular/core';
import Dexie from 'dexie';
import { defaultsDeep, get } from 'lodash';
import { MD5 } from 'object-hash';

import {
    PIP_CACHE_MODEL,
    PipCachePaginationParams,
    PipCacheInterceptorOptions,
    PipCacheModel,
    PipCacheInterceptorCollectionSettings,
    extractPaginationDefault,
} from './cache.models';
import { PipCacheConfigService } from './cache.config.service';
import { HttpParams } from '@angular/common/http';
import { isUndefined } from 'util';

class TotalItem {
    hash: string;
    total: {
        value: number;
        lastRead: number;
    };
    idxMap: any[];
}

@Injectable({
    providedIn: 'root'
})
export class PipCacheService {

    private openedDbs = new Map<string, Dexie>();

    constructor(
        private configService: PipCacheConfigService,
        @Optional() @Inject(PIP_CACHE_MODEL) private injectedModels: PipCacheModel[]
    ) { }

    private getDbName(modelName: string): string {
        if (!modelName) { throw new Error('Model name should be defined'); }
        return this.configService.config.prefix + modelName.charAt(0).toUpperCase() + modelName.slice(1);
    }

    private getDb(model: PipCacheModel): Dexie {
        if (!model || !model.name) { throw new Error('Model should be defined'); }
        const dbName = this.getDbName(model.name);
        if (this.openedDbs.has(dbName)) { return this.openedDbs.get(dbName); }
        const db = new Dexie(dbName);
        const modelKey = model.options.key || 'id';
        db.version(2).stores({
            items: modelKey,
            hashes: 'hash',
            lastRead: '',
            meta: ''
        });
        this.openedDbs.set(dbName, db);
        return db;
    }

    private getModel(modelName: string): PipCacheModel {
        return this.models.find(m => m.name === modelName);
    }

    public get models(): PipCacheModel[] { return this.injectedModels || []; }

    public async getItem(modelName: string, key: any, options?: PipCacheInterceptorOptions): Promise<any> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        const [expire, item] = await Promise.all([
            db.table('lastRead').get(key),
            db.table('items').get(key)
        ]);
        const maxAge = options && options.maxAge || model.options.maxAge;
        const expired = expire + maxAge <= new Date().valueOf();
        if (this.configService.config.enableLogs) {
            console.groupCollapsed('%c%s', 'color: green; font: 1.2rem Impact;', '[PipCache] GET', 'single item #' + key);
            console.log('Item: ', item);
            console.log('Expired: ', expired);
            console.log('Expired at: ', new Date(expire));
            console.groupEnd();
        }
        return expired ? null : item;
    }

    public async getItems(modelName: string, payload?: {
        httpParams?: HttpParams,
        interceptor?: PipCacheInterceptorCollectionSettings
    }): Promise<any[]> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        const modelKey = model.options.key || 'id';
        // get indexes of items we should receive
        const maxAge = get(payload, 'interceptor.options.maxAge', model.options.maxAge);
        if (this.configService.config.enableLogs) {
            console.groupCollapsed('%c%s', 'color: green; font: 1.2rem Impact;', '[PipCache] GET', 'collection of items');
            console.log('Payload: ', payload);
        }
        const [pagination, params]: [PipCachePaginationParams, HttpParams]
            = get(payload, 'interceptor.extractPagination', extractPaginationDefault)(payload && payload.httpParams);
        const hasPagination = Object.keys(pagination).length !== 0;
        const { offset, limit } = defaultsDeep(pagination, { offset: 0, limit: 0 });
        const hash = params && params.keys().length ? MD5(params) : '';
        return db.table('hashes').get(hash)
            .then((hi: TotalItem) => {
                const total = hi && hi.total && hi.total.value && hi.total.lastRead + maxAge >= new Date().valueOf()
                    ? hi.total.value : undefined;
                const upper = offset + limit;
                const plannedLength = hasPagination
                    ? (limit ? (total ? (upper > total ? total - offset : limit) : limit) : (total ? (total - offset) : (limit)))
                    : total;
                let idxMap = hi && hi.idxMap || [];
                if (hasPagination) {
                    if (limit) {
                        idxMap = idxMap.filter((it, idx) => idx >= offset && idx < upper);
                        if (idxMap.length !== plannedLength) {
                            if (this.configService.config.enableLogs) {
                                console.log('There\'s not enough information about indexes');
                                console.groupEnd();
                            }
                            return Promise.reject(null);
                        }
                    } else if (total !== undefined) {
                        idxMap = idxMap.filter((it, idx) => idx >= offset);
                        if (idxMap.length !== plannedLength) {
                            if (this.configService.config.enableLogs) {
                                console.log('Not all items presented in cache');
                                console.groupEnd();
                            }
                            return Promise.reject(null);
                        }
                    } else {
                        if (this.configService.config.enableLogs) {
                            console.log('We want to return all items, but we don\'t know how many they are');
                            console.groupEnd();
                        }
                        return Promise.reject(null);
                    }
                } else if (total === undefined) {
                    if (this.configService.config.enableLogs) {
                        console.log('We want to return all items, but we don\'t know how many they are');
                        console.groupEnd();
                    }
                    return Promise.reject(null);
                }
                return Promise.all([
                    Promise.resolve(idxMap),
                    !hasPagination && !hash ? db.table('items').toArray() : db.table('items').where(modelKey).anyOf(idxMap).toArray(),
                    !hasPagination && !hash ? db.table('lastRead').toArray() : db.table('lastRead').where('').anyOf(idxMap).toArray()
                ]);
            }).then(([ids, items, reads]) => {
                if (!items || items.length !== ids.length || !reads || reads.length !== ids.length) {
                    if (this.configService.config.enableLogs) {
                        console.warn('Not all items presented in cache');
                        console.groupEnd();
                    }
                    return null;
                }
                if (Math.min(...reads) + maxAge <= new Date().valueOf()) {
                    if (this.configService.config.enableLogs) {
                        console.log('Items was expired');
                        console.groupEnd();
                    }
                    return null;
                }
                const res = ids.map(id => items.find(it => it[modelKey] === id));
                if (this.configService.config.enableLogs) {
                    console.log('Items: ', res);
                    console.groupEnd();
                }
                return res;
            }).catch(reason => {
                if (reason === null) {
                    return null;
                } else {
                    throw reason;
                }
            });
    }

    public async setItem(modelName: string, item: any, options?: { removeTotal?: boolean }): Promise<any> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        const promises = [
            db.table('lastRead').put(new Date().valueOf(), item[model.options.key]),
            db.table('items').put(item)
        ];
        if (options) {
            if (options.removeTotal) {
                promises.push(db.table('hashes').toCollection().modify({ total: undefined }));
            }
        }
        return Promise.all(promises).then((data) => {
            if (this.configService.config.enableLogs) {
                console.groupCollapsed('%c%s', 'color: blue; font: 1.2rem Impact;',
                    '[PipCache] SET', 'single item #' + item[model.options.key]);
                console.log('Item: ', data[1]);
                console.log('Readed at: ', new Date());
                console.groupEnd();
            }
            return data[1];
        });
    }

    public async setItems(modelName: string, items: any[], payload?: {
        httpParams?: HttpParams,
        interceptor?: PipCacheInterceptorCollectionSettings
    }): Promise<any[]> {
        const model = this.getModel(modelName);
        const modelKey = model.options.key || 'id';
        const db = this.getDb(model);
        const lastRead = new Date().valueOf();
        const ids = items.map(it => it[modelKey]);
        let total;
        const [pagination, params]: [PipCachePaginationParams, HttpParams]
            = get(payload, 'interceptor.extractPagination', extractPaginationDefault)(payload && payload.httpParams);
        const hasPagination = Object.keys(pagination).length !== 0;
        const { offset, limit } = defaultsDeep(pagination, { offset: 0, limit: 0 });
        const hash = params && params.keys().length ? MD5(params) : '';
        const promises = [
            db.table('lastRead').bulkPut(new Array(items.length).fill(lastRead), ids),
            db.table('items').bulkPut(items),
            db.table('hashes').get(hash).then((hi: TotalItem) => {
                const nh = hi || Object.assign(new TotalItem(), { hash, total: {}, idxMap: [] });
                ids.forEach((id, idx) => nh.idxMap[idx + offset] = id);
                if (hasPagination && pagination.limit && items.length && items.length < pagination.limit || !hasPagination) {
                    total = (pagination.offset || 0) + items.length;
                    nh.total = {
                        value: total,
                        lastRead
                    };
                }
                return db.table('hashes').put(nh);
            })
        ];
        return Promise.all(promises).then(() => {
            if (this.configService.config.enableLogs) {
                console.groupCollapsed('%c%s', 'color: blue; font: 1.2rem Impact;', '[PipCache] SET', 'collection of items');
                console.log('Payload: ', payload);
                console.log('Items: ', items);
                console.log('Hash:', hash);
                console.log('Last read at: ', new Date());
                if (!isUndefined(total)) {
                    console.log(`New total for hash [${hash}]: ${total}`);
                }
                console.groupEnd();
            }
            return items;
        });
    }

    public async deleteItems(modelName: string, keys: any[]): Promise<any> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        return Promise.all([
            db.table('lastRead').bulkDelete(keys),
            db.table('items').bulkDelete(keys),
            db.transaction('rw', db.table('hashes'), async () => {
                await db.table('hashes').toCollection().modify(function () {
                    let removeTotal;
                    keys.forEach(key => {
                        const idx = this.value.idxMap.findIndex(id => id === key);
                        if (idx >= 0) {
                            this.value.idxMap.splice(idx, 1);
                            removeTotal = true;
                        }
                    });
                    if (removeTotal) {
                        delete this.value.total;
                    }
                });
            })
        ]).then(() => {
            if (this.configService.config.enableLogs) {
                console.groupCollapsed('%c%s', 'color: red; font: 1.2rem Impact;', '[PipCache] DELETE');
                console.log('Keys: ', keys);
                console.groupEnd();
            }
        });
    }

    public async clear(model?: string | string[]): Promise<any> {
        return new Promise(resolve => {
            const dbs: string[] = [];
            if (model) {
                Array.isArray(model)
                    ? dbs.push(...model.map(m => this.getDbName(m)))
                    : dbs.push(this.getDbName(model));
                resolve(dbs);
            } else {
                resolve(Dexie.getDatabaseNames());
            }
        }).then((names: string[]) => {
            const dbs = names.filter(name => name.startsWith(this.configService.config.prefix));
            if (this.configService.config.enableLogs) {
                console.log('databases to delete: ', names);
            }
            const promises = [];
            for (const name of dbs) {
                try {
                    const db = this.openedDbs.has(name) ? this.openedDbs.get(name) : new Dexie(name);
                    promises.push(db.table('items').clear());
                    promises.push(db.table('meta').clear());
                    promises.push(db.table('lastRead').clear());
                    promises.push(db.table('hashes').clear());
                } catch (err) {
                    if (this.configService.config.enableLogs) {
                        console.warn('Error opening database ' + name);
                    }
                }
            }
            return Promise.all(promises);
        }).then(res => {
            if (this.configService.config.enableLogs) {
                console.log('%c%s', 'color: blue; font: 1.2rem Impact;', '[PipCache] CLEAR');
                if (model) { console.log('Model(s): ', model); } else { console.log('all models'); }
            }
            return null;
        });
    }
}
