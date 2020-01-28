import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PipCacheService } from 'pip-webui2-cache';

import { AskComponent, PipAskDialogData } from './dialogs/ask/ask.component';
import { AppService } from './services';
import { Observable } from 'rxjs';

@Component({
  selector: 'pip-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public breadcrumb$: Observable<string>;
  public cacheEnabledCtrl: FormControl;

  constructor(
    private app: AppService,
    private cacheService: PipCacheService,
    private dialog: MatDialog
  ) {
    this.breadcrumb$ = this.app.breadcrumb$;
    this.cacheEnabledCtrl = this.app.cacheEnabledCtrl;
  }

  clear() {
    this.dialog.open(AskComponent, {
      data: {
        title: 'Clear cache',
        content: ['Do you really want to clear cache?'],
        actions: {
          no: {
            color: 'warn',
            returnValue: false,
            text: 'No'
          },
          yes: {
            returnValue: true,
            text: 'Yes'
          }
        },
        initFocusActionKey: 'no'
      } as PipAskDialogData
    }).afterClosed().toPromise().then(res => {
      if (res) {
        this.cacheService.clear();
      }
    });
  }

}
