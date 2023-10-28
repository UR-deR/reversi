import { toDisc } from './../domain/disc';
import { connectMysql } from '../dataaccess/connection';
import { GameGateway } from '../dataaccess/gameGateway';
import { Point } from '../domain/point';
import { TurnRepository } from '../domain/turnRepository';

const gameGateway = new GameGateway();

const turnRepository = new TurnRepository();

class FindLatestGameTurnByTurnCountDto {
  constructor(
    public turnCount: number,
    public board: number[][],
    public nextDisc: number | undefined,
    public winnerDisc: number | undefined
  ) {}
}

export class TurnSerivce {
  async findLatestGameTurnByTurnCount(turnCount: number) {
    const dbConnection = await connectMysql();

    try {
      const gameRecord = await gameGateway.findLatest(dbConnection);

      if (!gameRecord) {
        throw new Error(`Game not found`);
      }

      const turn = await turnRepository.findByGameIdAndTurnCount(dbConnection, gameRecord.id, turnCount);

      return new FindLatestGameTurnByTurnCountDto(turnCount, turn.board.discs, turn.nextDisc, undefined);
    } finally {
      await dbConnection.end();
    }
  }

  async registerTurn(turnCount: number, disc: number, x: number, y: number) {
    const dbConnection = await connectMysql();

    try {
      //　1つ前のターンを取得する
      const gameRecord = await gameGateway.findLatest(dbConnection);

      if (!gameRecord) {
        throw new Error(`Game not found. Turn count: ${turnCount}`);
      }

      const previousTurn = await turnRepository.findByGameIdAndTurnCount(dbConnection, gameRecord.id, turnCount - 1);

      const newTurn = previousTurn.placeNext(toDisc(disc), new Point(x, y));

      await turnRepository.save(dbConnection, newTurn);

      await dbConnection.commit();
    } finally {
      await dbConnection.end();
    }
  }
}
