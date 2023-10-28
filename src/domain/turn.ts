import { Board } from './board';
import { DISC, Disc } from './disc';
import { Move } from './move';
import { Point } from './point';

export class Turn {
  constructor(
    private _gameId: number,
    private _turnCount: number,
    private _nextDisc: Disc,
    private move: Move | undefined,
    private _board: Board,
    private _endAt: Date
  ) {}

  placeNext(disc: Disc, point: Point): Turn {
    if (disc !== this.nextDisc) {
      throw new Error('Invalid disc');
    }
    const move = new Move(disc, point);
    const nextBoard = this._board.place(move);
    //TODO: 次の石が置けない場合はskipさせたい
    const nextDisc = disc === DISC.DARK ? DISC.LIGHT : DISC.DARK;
    return new Turn(this.gameId, this.turnCount + 1, nextDisc, move, nextBoard, new Date());
  }

  get gameId() {
    return this._gameId;
  }

  get turnCount() {
    return this._turnCount;
  }

  get nextDisc() {
    return this._nextDisc;
  }

  get board() {
    return this._board;
  }

  get endAt() {
    return this._endAt;
  }
}
