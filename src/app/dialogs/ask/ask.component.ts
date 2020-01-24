import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PipAskDialogData {
  title: string;
  content: string[];
  actions: {
    [actionName: string]: {
      text: string;
      returnValue: any;
      color?: string;
    }
  };
  initFocusActionKey?: string;
  html?: boolean;
}

@Component({
  selector: 'pip-ask',
  templateUrl: './ask.component.html',
  styleUrls: ['./ask.component.scss']
})
export class AskComponent {

  public keys: string[];
  public initFocusKey: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PipAskDialogData,
    private dialogRef: MatDialogRef<AskComponent>
  ) {
    this.keys = Object.keys(this.data.actions).filter(key => this.data.actions.hasOwnProperty(key));
    if (this.keys.length) {
      if (this.data.initFocusActionKey && this.data.actions.hasOwnProperty(this.data.initFocusActionKey)) {
        this.initFocusKey = this.data.initFocusActionKey;
      } else {
        this.initFocusKey = this.keys[this.keys.length - 1];
      }
    }
  }

  public onClose(key: string) {
    this.dialogRef.close(this.data.actions[key].returnValue);
  }

}
