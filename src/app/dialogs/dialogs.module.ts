import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { AskComponent } from './ask/ask.component';

const components = [
  AskComponent
];

@NgModule({
  declarations: components,
  exports: components,
  entryComponents: components,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class DialogsModule { }
