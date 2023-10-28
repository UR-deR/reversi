import { TurnRepository } from './../domain/turnRepository';
import { connectMysql } from '../dataaccess/connection';
import { GameGateway } from '../dataaccess/gameGateway';

import { getFirstTurn } from '../domain/turn';

const gameGateway = new GameGateway();

const turnRepository = new TurnRepository();

export class GameService {
  async startNewGame() {
    const now = new Date();
    const dbConnection = await connectMysql();

    try {
      await dbConnection.beginTransaction();
      const gameRecord = await gameGateway.insert(dbConnection, now);

      const firstTurn = getFirstTurn(gameRecord.id, now);
      await turnRepository.save(dbConnection, firstTurn);
      await dbConnection.commit();
    } finally {
      await dbConnection.end();
    }
  }
}
