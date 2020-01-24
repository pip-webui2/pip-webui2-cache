import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PipCacheService } from 'pip-webui2-cache';
import { AskComponent, PipAskDialogData } from './dialogs/ask/ask.component';

@Component({
  selector: 'pip-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private cacheService: PipCacheService,
    private dialog: MatDialog
  ) { }

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
