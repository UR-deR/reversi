import { connectMysql } from '../dataaccess/connection';
import { GameGateway } from '../dataaccess/gameGateway';
import { SquareGateway } from '../dataaccess/squareGateway';
import { TurnGateway } from '../dataaccess/turnGateway';
import { DARK, INITIAL_BOARD } from './constants';

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const squareGateway = new SquareGateway();

export class GameService {
  async startNewGame() {
    const now = new Date();
    const dbConnection = await connectMysql();

    try {
      await dbConnection.beginTransaction();

      const gameRecord = await gameGateway.insert(dbConnection, now);

      const turnRecord = await turnGateway.insert(dbConnection, gameRecord.id, 0, DARK, now);
      await squareGateway.insertAll(dbConnection, turnRecord.id, INITIAL_BOARD);
      await dbConnection.commit();
    } finally {
      await dbConnection.end();
    }
  }
}
