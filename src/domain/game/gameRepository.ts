import mysql from 'mysql2/promise';
import { Game } from './game';
import { GameGateway } from '../../dataaccess/gameGateway';

const gameGateway = new GameGateway();

export class GameRepository {
  async findLatest(dbConnection: mysql.Connection): Promise<Game | undefined> {
    const gameRecord = await gameGateway.findLatest(dbConnection);

    if (!gameRecord) {
      return undefined;
    }

    return new Game(gameRecord.id, gameRecord.startedAt);
  }

  async save(dbConnection: mysql.Connection, game: Game): Promise<Game> {
    const gameRecord = await gameGateway.insert(dbConnection, game.startedAt);
    return new Game(gameRecord.id, gameRecord.startedAt);
  }
}
