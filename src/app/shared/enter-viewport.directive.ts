import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Host,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";

@Directive({
  selector: '[enter-viewport]'
})
export class EnterViewportDirective {

 @Input() threshold: number = 0.0;
 @Output() visibilityChange: EventEmitter<string> = new EventEmitter<string>();
 private _observer: IntersectionObserver;

 constructor(@Host() private _elementRef: ElementRef) {}

 ngAfterViewInit(): void {
   try {
     const options = {
       root: null,
       rootMargin: this.threshold.toString() + "px",
       threshold: 0,
     };
     this._observer = new IntersectionObserver(this._callback, options);
     this._observer.observe(this._elementRef.nativeElement);
   } catch (ex) {
     console.log("Intersection-Observer connection failed.");
     //  console.log(ex);
   }
 }

 ngOnDestroy() {
   if (this._observer != undefined) this._observer.disconnect();
 }

 private _callback = (entries, observer) => {
   entries.forEach((entry) =>
     this.visibilityChange.emit(entry.isIntersecting ? "VISIBLE" : "HIDDEN")
   );
 };

}
