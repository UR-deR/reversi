import { Disc } from './disc';
import { Move } from './move';

export class Board {
  constructor(private _discs: Disc[][]) {}

  place(move: Move): Board {
    const newDiscs = structuredClone(this._discs);
    newDiscs[move.point.y][move.point.x] = move.disc;
    return new Board(newDiscs);
  }

  get discs() {
    return this._discs;
  }
}
