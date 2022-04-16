import { sequence } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SequenceAnimState } from 'app/types/sequence-anim-state';

import { SequenceAnimStateService } from '../core/sequence-anim-state.service';

@Component({
  selector: 'sequence-animation',
  templateUrl: './sequence-animation.component.html',
  styleUrls: ['./sequence-animation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Sequence should always start at 0. Then specify the frames of the sequences.
 * When exporting a sequence, we use the name convetion e.g. '04000.jp'
 */
export class SequenceAnimationComponent implements AfterViewInit {
  @Input() mainId!: string;

  transKeyObj: any = {};

  /**
   * Container scroll height.
   */
  @Input() containerScrollHeight: string;
  @Input() backgroundColor: string;

  /**
   * The percent of the total scroll-height of the container, the whole scrolling animation should take place.
   * At that percent of the complete scrollContainer, the last frame is displayed.
   * Format example: 0.3
   */
  @Input() scrollAreaPercent!: 0.4;

  /**
   * Canvas requires the true size of the images to be set as the hieght and width.
   */
  @Input() canvasHeight: number;
  /**
   * Canvas requires the true size of the images to be set as the hieght and width.
   */
  @Input() canvasWidth: number;

  @Input() zIndex: string = '0';

  /**
   * The image file name length without extension. Our standard is 5 chars.
   */
  @Input() imageNameLength: number;

  /**
   * Of course, if the last frame is 180, the framecount is 181.
   */
  @Input() frameCount: number;

  /**
   * Either the url in format "https://www.stingray-software.eu/projects/stingray/webpage/data/scroll-sequences/test1-roots"
   * Or a path to subdirectory
   */
  @Input() pathToDirectory: string =
    'https://www.stingray-software.eu/projects/stingray/webpage/data/scroll-sequences/test1-roots';

  /**
   * An animation parent is required, to determine the exact postion of the sequence animation child on each page.
   */
  @Input() animationParentId!: string;

  /**
   * Can be set to use an extra, small button at the bottom of the element.
   */
  @Input() buttonRoute: string;
  /**
   * Can be set to use an extra, small button at the bottom of the element.
   */
  @Input() buttonCubicImage: string;

  @Input() titleText: string;
  @Input() textColor: string = 'white';

  @Input() topOfPage: boolean = false; // a bit skecthy, but solves the bug, needed to get the very first animation when on top of page

  /**
   * An optional callback to react in the parent component qwhen the index changes.
   */
  @Output() imageIndexChanged = new EventEmitter<number>();

  @Input() fileExtension: string = 'jpg'; // a bit skecthy, but solves the bug, needed to get the very first animation when on top of page

  public context: CanvasRenderingContext2D;

  animationCanvas: any; //** Preferred use of getElementById because of unique ids */

  sequenceAnimationContainer: any;

  containerPagePosition: number = undefined;

  img = new Image();

  window: any;

  state: SequenceAnimState;

  isVisible: boolean = true;

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    private stateService: SequenceAnimStateService
  ) {
    this.window = this.doc.defaultView;
  }

  ngOnInit(): void {
    //** When using with i18n Translations */
    /*     this.transKeyObj = this.utilsS.getTranslationKeyObject(
      this.mainId,
      'SequenceAnimationComponent'
    ); */
  }

  ngOnDestroy() {
    this.stateService.updateState(this.mainId, this.state);
  }

  private initState() {
    this.state.id = this.mainId;
    this.preloadImages();
  }

  ngAfterViewInit() {
    //**Dom Elements */

    this.sequenceAnimationContainer = this.doc.getElementById(
      'sequenceAnimationContainer_' + this.mainId
    );

    this.animationCanvas = this.doc.getElementById(
      'sequenceAnimationCanvas_' + this.mainId
    );

    this.context = this.animationCanvas.getContext('2d');

    this.sequenceAnimationContainer.setAttribute(
      'style',
      'height: auto' + '; background-color: ' + this.backgroundColor
    );

    //**Init state */
    this.state = this.stateService.getStateOrCreate(this.mainId);

    if (this.state.id == null || this.state.images.length < 2) {
      this.initState();
    }

    if (this.containerPagePosition == undefined) {
      this.containerPagePosition = this.getPosRelativeToParent().top;
    }

    if (this.topOfPage) {
      this.analyseScrollPositionAndUpdateCanvas(true);
    } else {
      this.img.src = this.currentFrame(0);
      this.img.onload = () => this.context.drawImage(this.img, 0, 0);
    }
  }

  getPosRelativeToParent() {
    var parentPos = document
        .getElementById(this.animationParentId)
        .getBoundingClientRect(),
      childPos = this.sequenceAnimationContainer.getBoundingClientRect(),
      relativePos = {
        top: childPos.top - parentPos.top,
        bottom: childPos.bottom - parentPos.bottom,
      };

    return relativePos;
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.isVisible) {
      this.containerPagePosition = this.getPosRelativeToParent().top;
      //perfectly working workaround for wrong containerpositions
      this.analyseScrollPositionAndUpdateCanvas(false);
    }
  }

  //*** Hilfsmethoden */

  analyseScrollPositionAndUpdateCanvas(requestImageFreshly: boolean) {
    let scrollTop =
      window.pageYOffset ||
      this.doc.documentElement.scrollTop ||
      this.doc.body.scrollTop; //**Wieviele pixel zu dem zeitpunkt gescrollt sind */

    let maxScroll =
      this.scrollAreaPercent *
      (this.sequenceAnimationContainer.scrollHeight +
        this.containerPagePosition); //** The height on which the scrollcontainer ends */

    /* optional logs
    console.log("Html scroll top: " + scrollTop);

    console.log("maxScrollTop: " + maxScroll); */

    if (
      scrollTop >= this.containerPagePosition ||
      (scrollTop == 0 && this.topOfPage)
    ) {
      /* console.log(scrollTop);
      console.log("Contaienrpagepos:" + this.containerPagePosition);
      */
      scrollTop = scrollTop - this.containerPagePosition;

      const scrollFraction = scrollTop / maxScroll;
      let frameIndex = Math.min(
        this.frameCount - 1,
        Math.ceil(scrollFraction * this.frameCount)
      );

      if (scrollFraction <= 0.000001 && !this.topOfPage) {
        frameIndex = 0;
      }

      // console.log(scrollFraction);

      this.imageIndexChanged.emit(frameIndex);

      if (requestImageFreshly) {
        this.img.src = this.currentFrame(frameIndex);
        try {
          this.img.onload = () => this.context.drawImage(this.img, 0, 0);
        } catch (ex) {
          console.log(this.img);
        }
      } else {
        if (frameIndex < this.frameCount) {
          try {
            requestAnimationFrame(() => this.updateImage(frameIndex));
          } catch (ex) {
            requestAnimationFrame(() => this.updateImage(1));
          }
        }
      }
    }
  }

  currentFrame(index) {
    return `${this.pathToDirectory}/${index
      .toString()
      .padStart(this.imageNameLength, '0')}.${this.fileExtension}`;
  }

  _visibilityChangeHandler(visbility: string) {
    if (visbility == 'HIDDEN') {
      this.animationCanvas.setAttribute('style', 'opacity: 0;');
      this.isVisible = false;
    }

    if (visbility == 'VISIBLE') {
      this.animationCanvas.setAttribute('style', 'opacity:1;');
      this.isVisible = true;
    }
  }

  // ** Second Method to get images from cache

  preloadImages = () => {
    for (let i = 0; i < this.frameCount; i++) {
      this.state.images[i] = new Image();
      this.state.images[i].src = this.currentFrame(i);
    }
    // console.log(this.state.images);
  };

  updateImage(index) {
    //console.log("update image for index " + index);
    if (this.state.images[index] == null) {
      if (this.stateService.stateMap.get(this.mainId).images[index] == null) {
        const img = new Image();
        img.src = this.currentFrame(index);
        this.state.images[index] = img;
        try {
          this.context.drawImage(img, 0, 0);
        } catch (ex) {
          console.log(img);
        }
      } else {
        try {
          this.context.drawImage(
            this.stateService.stateMap.get(this.mainId).images[index],
            0,
            0
          );
        } catch (ex) {
          console.log(
            this.stateService.stateMap.get(this.mainId).images[index]
          );
        }
      }
    } else {
      try {
        this.context.drawImage(this.state.images[index], 0, 0); // Else us image of state array
      } catch (ex) {
        //  console.log(this.state.images[index]);
      }
    }
  }

  //**** Initial Method to get images from cache:: faulty implementation*/

  /*   preloadImages() {
    for (let i = 1; i < this.frameCount; i++) {
      const img = new Image();
      img.src = this.currentFrame(i);
    }
  }

  updateImage(index) {
    try {
      this.img.src = this.currentFrame(index);
      this.context.drawImage(this.img, 0, 0);
    } catch (ex) {
      console.error(ex);
    }
  }
 */
}
