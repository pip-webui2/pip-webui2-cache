import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CreateComponent } from './create/create.component';
import { UpdateComponent } from './update/update.component';
import { ReadComponent } from './read/read.component';
import { DeleteComponent } from './delete/delete.component';
import { AppMaterialModule } from '../material.module';

@NgModule({
  declarations: [CreateComponent, UpdateComponent, ReadComponent, DeleteComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppMaterialModule
  ]
})
export class PagesModule { }
