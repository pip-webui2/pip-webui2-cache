import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
import { defaultsDeep } from 'lodash';
import { Observable } from 'rxjs';

import { Photo } from '../models';

@Injectable()
export class PhotosDataService {

    private httpBackend: HttpClient;
    private photosUrl = 'https://5c78f6073a89af0014cd7154.mockapi.io/api/v1/photos';

    constructor(
        handler: HttpBackend,
        private http: HttpClient
    ) {
        this.httpBackend = new HttpClient(handler);
    }

    getPhotos(options?: { cache: boolean }, params?: { page: number, take: number }): Observable<Photo[]> {
        options = defaultsDeep({}, options, { cache: true });
        let pars = new HttpParams();
        if (params) {
            pars = pars.set('p', params.page.toString());
            pars = pars.set('l', params.take.toString());
        }
        const http = options.cache ? this.http : this.httpBackend;
        return http.get<Photo[]>(this.photosUrl, { params: pars });
    }

    getPhoto(id: string, options?: { cache: boolean }): Observable<Photo> {
        options = defaultsDeep({}, options, { cache: true });
        const http = options.cache ? this.http : this.httpBackend;
        return http.get<Photo>(this.photosUrl + '/' + id);
    }

    createPhotos(photos: Photo[], options?: { cache: boolean }): Observable<Photo[]> {
        options = defaultsDeep({}, options, { cache: true });
        const http = options.cache ? this.http : this.httpBackend;
        return http.post<Photo[]>(this.photosUrl, photos);
    }

    createPhoto(photo: Photo, options?: { cache: boolean }): Observable<Photo> {
        options = defaultsDeep({}, options, { cache: true });
        const http = options.cache ? this.http : this.httpBackend;
        return http.post<Photo>(this.photosUrl, photo);
    }

    updatePhoto(id: number, photo: Photo, options?: { cache: boolean }): Observable<Photo> {
        options = defaultsDeep({}, options, { cache: true });
        const http = options.cache ? this.http : this.httpBackend;
        return http.put<Photo>(this.photosUrl + '/' + id, photo);
    }

    deletePhoto(id: number, options?: { cache: boolean }): Observable<any> {
        options = defaultsDeep({}, options, { cache: true });
        const http = options.cache ? this.http : this.httpBackend;
        return http.delete<any>(this.photosUrl + '/' + id);
    }

}
