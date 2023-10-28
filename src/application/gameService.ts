import { TurnRepository } from '../domain/turn/turnRepository';
import { connectMysql } from '../dataaccess/connection';
import { getFirstTurn } from '../domain/turn/turn';
import { GameRepository } from '../domain/game/gameRepository';
import { Game } from '../domain/game/game';

const turnRepository = new TurnRepository();
const gameRepository = new GameRepository();

export class GameService {
  async startNewGame() {
    const now = new Date();
    const dbConnection = await connectMysql();

    try {
      await dbConnection.beginTransaction();
      const game = await gameRepository.save(dbConnection, new Game(undefined, now));
      if (!game.id) {
        throw new Error(`Game id is undefined`);
      }
      const firstTurn = getFirstTurn(game.id, now);
      await turnRepository.save(dbConnection, firstTurn);
      await dbConnection.commit();
    } finally {
      await dbConnection.end();
    }
  }
}
