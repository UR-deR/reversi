import { toDisc } from '../domain/turn/disc';
import { connectMysql } from '../infrastructure/connection';
import { GameGateway } from '../infrastructure/gameGateway';
import { Point } from '../domain/turn/point';
import { TurnRepository } from '../domain/turn/turnRepository';
import { GameRepository } from '../domain/game/gameRepository';

const gameGateway = new GameGateway();

const turnRepository = new TurnRepository();
const gameRepository = new GameRepository();

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
      const game = await gameRepository.findLatest(dbConnection);

      if (!game) {
        throw new Error(`Game not found`);
      }

      if (!game.id) {
        throw new Error(`Game id is undefined`);
      }

      const turn = await turnRepository.findByGameIdAndTurnCount(dbConnection, game.id, turnCount);

      return new FindLatestGameTurnByTurnCountDto(turnCount, turn.board.discs, turn.nextDisc, undefined);
    } finally {
      await dbConnection.end();
    }
  }

  async registerTurn(turnCount: number, disc: number, x: number, y: number) {
    const dbConnection = await connectMysql();

    try {
      //　1つ前のターンを取得する
      const game = await gameRepository.findLatest(dbConnection);

      if (!game) {
        throw new Error(`Game not found`);
      }

      if (!game.id) {
        throw new Error(`Game id is undefined`);
      }

      const previousTurn = await turnRepository.findByGameIdAndTurnCount(dbConnection, game.id, turnCount - 1);

      const newTurn = previousTurn.placeNext(toDisc(disc), new Point(x, y));

      await turnRepository.save(dbConnection, newTurn);

      await dbConnection.commit();
    } finally {
      await dbConnection.end();
    }
  }
}
