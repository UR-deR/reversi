import { DISC, Disc } from './disc';
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

const { EMPTY: E, DARK: D, LIGHT: L } = DISC;

const INITIAL_DISCS = [
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, D, L, E, E, E],
  [E, E, E, L, D, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
  [E, E, E, E, E, E, E, E],
];

export const initialBoard = new Board(INITIAL_DISCS);
