import { Injectable, Optional, Inject } from '@angular/core';
import Dexie from 'dexie';

import {
    PIP_CACHE_MODEL,
    PipCacheCollectionParams,
    PipCacheInterceptorOptions,
    PipCacheModel,
} from './cache.models';
import { PipCacheConfigService } from './cache.config.service';

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
        db.version(1).stores({
            items: modelKey,
            lastRead: '',
            indexes: 'idx,' + modelKey,
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

    public async getItems(modelName: string, params?: PipCacheCollectionParams, options?: PipCacheInterceptorOptions): Promise<any[]> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        const modelKey = model.options.key || 'id';
        // get indexes of items we should receive
        const totalDetails: { total: number, lastRead: number } = await db.table('meta').get('total');
        const maxAge = options && options.maxAge || model.options.maxAge;
        const total = totalDetails && (totalDetails.lastRead + maxAge >= new Date().valueOf())
            ? totalDetails.total : undefined;
        if (this.configService.config.enableLogs) {
            console.groupCollapsed('%c%s', 'color: green; font: 1.2rem Impact;', '[PipCache] GET', 'collection of items');
            console.log('Params: ', params);
        }
        if (params && Object.keys(params).length) {
            // If we have some limitations we have to get ids of items and then items
            const offset = params.hasOwnProperty('offset') ? params.offset : 0;
            const limit = params.hasOwnProperty('limit') ? params.limit : undefined;
            if (limit !== undefined) {
                // This is the only case where we don't need to know about total items count
                const indexes = await db.table('indexes').where('idx').between(offset, offset + limit, true, false).toArray();
                if (indexes.length !== limit && (total === undefined || indexes.length !== total - offset)) {
                    if (this.configService.config.enableLogs) {
                        console.log('There\'s not enough information about indexes');
                        console.groupEnd();
                    }
                    return null;
                } else {
                    const ids = indexes.map(idx => idx.id);
                    const [items, reads] = await Promise.all([
                        db.table('items').where(modelKey).anyOf(ids).toArray(),
                        db.table('lastRead').where('').anyOf(ids).toArray()
                    ]);
                    if (!items || items.length !== indexes.length || !reads || reads.length !== indexes.length) {
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
                    if (this.configService.config.enableLogs) {
                        console.log('Items: ', items);
                        console.groupEnd();
                    }
                    return items;
                }
            } else if (total !== undefined) {
                // In this case we should check is total count of items presented
                const indexes = await db.table('indexes').where('idx').aboveOrEqual(offset).toArray();
                if (indexes.length !== limit || indexes.length !== total - offset) {
                    if (this.configService.config.enableLogs) {
                        console.log('Not all items presented in cache');
                        console.groupEnd();
                    }
                    return null;
                }
                const ids = indexes.map(idx => idx.id);
                const [items, reads] = await Promise.all([
                    db.table('items').where(modelKey).anyOf(ids).toArray(),
                    db.table('lastRead').where(modelKey).anyOf(ids).toArray()
                ]);
                if (!items || items.length !== indexes.length || !reads || reads.length !== indexes.length) {
                    if (this.configService.config.enableLogs) {
                        console.log('Not all items presented in cache');
                        console.groupEnd();
                    }
                    return null;
                }
                if (Math.min(...reads) + maxAge >= new Date().valueOf()) {
                    if (this.configService.config.enableLogs) {
                        console.log('Items was expired');
                        console.groupEnd();
                    }
                    return null;
                }
                if (this.configService.config.enableLogs) {
                    console.log('Items: ', items);
                    console.groupEnd();
                }
                return items;
            }
        } else if (total !== undefined) {
            // If there is no limitations we have to return all items if they're all presented
            const [items, reads] = await Promise.all([
                db.table('items').toArray(),
                db.table('lastRead').toArray()
            ]);
            if (!items || items.length !== total || !reads || reads.length !== total) {
                if (this.configService.config.enableLogs) {
                    console.log('Not all items presented in cache');
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
            if (this.configService.config.enableLogs) {
                console.log('Items: ', items);
                console.groupEnd();
            }
            return items;
        } else {
            if (this.configService.config.enableLogs) {
                console.log('We want to return all items, but we don\'t know how many they are');
                console.groupEnd();
            }
            return null;
        }
    }

    public async setItem(modelName: string, item: any, options?: { removeTotal?: boolean }): Promise<any> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        const [expire, it] = await Promise.all([
            db.table('lastRead').put(new Date().valueOf(), item[model.options.key]),
            db.table('items').put(item)
        ]);
        if (options) {
            if (options.removeTotal) {
                await db.table('meta').delete('total');
            }
        }
        if (this.configService.config.enableLogs) {
            console.groupCollapsed('%c%s', 'color: blue; font: 1.2rem Impact;',
                '[PipCache] SET', 'single item #' + item[model.options.key]);
            console.log('Item: ', it);
            console.log('Readed at: ', new Date());
            console.groupEnd();
        }
        return it;
    }

    public async setItems(modelName: string, items: any[], payload?: {
        params?: PipCacheCollectionParams, options?: PipCacheInterceptorOptions
    }): Promise<any[]> {
        const model = this.getModel(modelName);
        const modelKey = model.options.key || 'id';
        const db = this.getDb(model);
        const lr = new Date().valueOf();
        const offset = payload && payload.params && payload.params.offset || 0;
        const ids = items.map(it => it[modelKey]);
        const indexes = ids.map((id, idx) => ({ id, idx: idx + offset }));
        const promises = [
            db.table('lastRead').bulkPut(new Array(items.length).fill(lr), ids),
            db.table('items').bulkPut(items),
            db.table('indexes').bulkPut(indexes)
        ];
        let total;
        if ((payload && payload.params && payload.params.limit && items && items.length < payload.params.limit)
            || (!payload || !payload.params || !Object.keys(payload.params).length)) {
            total = (payload.params.offset || 0) + items.length;
            promises.push(db.table('meta').put({ lastRead: new Date().valueOf(), total }, 'total'));
        }
        return Promise.all(promises).then(([args]) => {
            if (this.configService.config.enableLogs) {
                console.groupCollapsed('%c%s', 'color: blue; font: 1.2rem Impact;', '[PipCache] SET', 'collection of items');
                console.log('Params: ', payload.params);
                console.log('Items: ', items);
                console.log('Last read at: ', new Date());
                if (args && args.length === 2) {
                    console.log('New total: ', total);
                }
                console.groupEnd();
            }
            return items;
        });
    }

    public async deleteItems(modelName: string, keys: any[]): Promise<any> {
        const model = this.getModel(modelName);
        const db = this.getDb(model);
        const modelKey = model.options.key || 'id';
        return Promise.all([
            db.table('lastRead').bulkDelete(keys),
            db.table('items').bulkDelete(keys),
            db.table('indexes').where(modelKey).anyOf(keys).delete(),
            db.table('meta').delete('total')
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
                    promises.push(db.table('indexes').clear());
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
