import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from './components/icon/icon.module';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IconModule,

    // Pipes
    TitleCasePipe,
    RelativeTimePipe,
    CurrencyFormatPipe,

    // Directives
    ClickOutsideDirective,
    AutoFocusDirective,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IconModule,
    RouterLink,
    RouterLinkActive,

    // Pipes
    TitleCasePipe,
    RelativeTimePipe,
    CurrencyFormatPipe,

    // Directives
    ClickOutsideDirective,
    AutoFocusDirective,
  ],
})
export class SharedModule {}
