# <img src="https://github.com/pip-webui/pip-webui/raw/master/doc/Logo.png" alt="Pip.WebUI Logo" style="max-width:30%"> <br/> Caching tools

![](https://img.shields.io/badge/license-MIT-blue.svg)

**pip-webui2-cache** module contains cache behavior

## Usage

To start using cache you should:
### Step 1
Include module into your application module. `PipCacheModule.forRoot(config?: PipCacheModuleConfig)`.  
Config has this optional properties:
* `enableLogs` - turn on/off logs to console
* `prefix` - custom prefix for IndexedDB database name

### Step 2
Provide model(s) description through InjectionToken `PIP_CACHE_MODEL` with enabled flag `multi`.  
Structure of `PipCacheModel`:
```js
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

export class PipCacheCollectionParams {
    offset?: number;
    limit?: number;
}

export class PipCacheInterceptorOptions {
    maxAge?: number;
}
```
Description:
* `name` - name of model. Module will use this name with prefix as database name;
* `options`:
  * `maxAge` - how long item will remain in cache;
  * `key` - custom key field different from `id` which is default
* `interceptors` - how cache will intercept requests:
  * `item` - how cache will intercept request for single item:
    * `match` - regular expression to catch single item request. It **HAVE TO** contain named group like `/items\/(?<id>[^ $\/]*)/` to get key from request;
    * `options` - custom options to overwrite model options;
    * `getKey` - function to retrieve key from groups received by matching regular expression of url.
  * `collection` - how cache will intercept request for collection of items:
    * `match` - regular expression to catch single item request. It **HAVE TO** contain named group like `/items\/(?<id>[^ $\/]*)/` to get key from request;
    * `options` - custom options to overwrite model options;
    * `responseModify` - functions to modify response if items returned in some property of response, not array;
    * `getParams` - cache could accept parameters `offset` and `limit` to slice collections, but not all systems has the same naming. It will look for default parameters if this function won't provided.

Example:
```js
export function getPhotosKey(groups: any) { return groups && groups.id; }
export function getPhotosParams(params: HttpParams): PipCacheCollectionParams {
  const res: PipCacheCollectionParams = {};
  if (params.has('p') && params.has('l')) {
    res.limit = parseInt(params.get('l'), 10);
    res.offset = (parseInt(params.get('p'), 10) - 1) * res.limit;
  }
  return res;
}
// ...
{
  provide: PIP_CACHE_MODEL,
  useValue: {
    name: 'photos',
    options: {
      maxAge: 1000 * 60 * 2, // 2 minutes
      key: 'id' // key 'id'
    },
    interceptors: {
      item: {
        match: new RegExp('photos\/(?<id>[^ $\/]*)'), // Catch all requests and look for id
        getKey: getPhotosKey  // return 'id' from RexExp match
      },
      collection: {
        match: new RegExp('photos'), // Catch all requests and look for 'photos' in request
        getParams: getPhotosParams // Custom params handler
      }
    }
  } as PipCacheModel,
  multi: true
}
```

**NB!** All interceptors will be checked until some of them will match. If there's no interceptors found - cache won't apply. Interceptors order is important, `item` should be always before `collection`, because it has more detailed url to match.