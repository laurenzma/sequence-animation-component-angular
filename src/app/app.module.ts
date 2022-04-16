import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { SequenceAnimationComponent } from './sequence-animation-component/sequence-animation.component';
import { EnterViewportDirective } from './shared/enter-viewport.directive';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    EnterViewportDirective,
    AppComponent,
    SequenceAnimationComponent,
  ],
  imports: [BrowserModule, CommonModule, RouterModule],
  exports: [SequenceAnimationComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {

}
