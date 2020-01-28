import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AppService {
    private breadcrumb$$ = new BehaviorSubject<string>('');

    public cacheEnabledCtrl = new FormControl(true);
    public get cacheEnabled(): boolean { return this.cacheEnabledCtrl.value; }

    public set breadcrumb(breadcrumb: string) { this.breadcrumb$$.next(breadcrumb); }
    public get breadcrumb(): string { return this.breadcrumb$$.value; }
    public get breadcrumb$(): Observable<string> { return this.breadcrumb$$.asObservable(); }

}
