# Pip.WebUI.Cache Changelog

## <a name="1.1.1"></a> 1.1.1 (2020-01-29)

Fixed: no named groups supported by RegExp in Firefox

### Features
* Caching request using angular interceptor system

### Breaking Changes
No breaking changes in this version

### Bug Fixes
* interceptor expressions now should use whole match instead of named groups, because they're not supported in some browsers

## <a name="1.1.0"></a> 1.1.0 (2020-01-29)

Request with params now supported

### Features
* Caching request using angular interceptor system

### Breaking Changes
* Model -> Interceptor -> Collection now has `extractPagination` function instead of `getParams`

### Bug Fixes
No fixes in this version

## <a name="1.0.0"></a> 1.0.0 (2020-01-24)

Initial release

### Features
* Caching request using angular interceptor system

### Breaking Changes
No breaking changes in this version

### Bug Fixes
No fixes in this version
