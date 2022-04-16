import { Injectable, OnDestroy } from '@angular/core';
import { SequenceAnimState } from '../types/sequence-anim-state';

@Injectable({
  providedIn: 'root',
})
export class SequenceAnimStateService {
  stateMap: Map<string, SequenceAnimState> = new Map();

  constructor() {}

  ngOnDestroy(): void {
    this.stateMap.clear();
    this.stateMap = new Map();
  }

  public getStateOrCreate(id: string): SequenceAnimState {
    var state = this.stateMap.get(id);

    if (state == null) {
      this.updateState(id, new SequenceAnimState());
    } else if (state.containerTop == null) {
      this.updateState(id, new SequenceAnimState());
    }

    return this.stateMap.get(id);
  }

  public updateState(id: string, state: SequenceAnimState) {
    this.stateMap.set(id, state);
  }
}
