export class TurnRecord {
  constructor(
    private _id: number,
    private _gameId: number,
    private _turnCount: number,
    private _nextDisc: number,
    private _endAt: Date
  ) {}
}
