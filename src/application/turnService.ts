import { connectMysql } from '../dataaccess/connection';
import { GameGateway } from '../dataaccess/gameGateway';
import { MoveGateway } from '../dataaccess/moveGateway';
import { SquareGateway } from '../dataaccess/squareGateway';
import { TurnGateway } from '../dataaccess/turnGateway';
import { DARK, LIGHT } from './constants';

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

export class TurnSerivce {
  async findLatestGameTurnByTurnCount(turnCount: number) {
    const dbConnection = await connectMysql();

    try {
      const gameRecord = await gameGateway.findLatest(dbConnection);

      if (!gameRecord) {
        throw new Error(`Game not found`);
      }

      const turnRecord = await turnGateway.findForGameAndTurnCount(dbConnection, gameRecord.id, turnCount);

      if (!turnRecord) {
        throw new Error(`Turn not found`);
      }

      const squareRecords = await squareGateway.findAllByTurnId(dbConnection, turnRecord.id);

      const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
      squareRecords.forEach((square) => {
        board[square.y][square.x] = square.disc;
      });

      return {
        turnCount,
        board,
        nextDisc: turnRecord.nextDisc,
        winnerDisc: null,
      };
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

      const previousTurnCount = turnCount - 1;

      const previousTurnRecord = await turnGateway.findForGameAndTurnCount(
        dbConnection,
        gameRecord.id,
        previousTurnCount
      );

      if (!previousTurnRecord) {
        throw new Error(`Turn not found`);
      }

      const squareRecords = await squareGateway.findAllByTurnId(dbConnection, previousTurnRecord.id);

      const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
      squareRecords.forEach((square) => {
        board[square.y][square.x] = square.disc;
      });

      board[y][x] = disc;

      const now = new Date();
      const nextDisc = disc === DARK ? LIGHT : DARK;
      const turnRecord = await turnGateway.insert(dbConnection, gameRecord.id, turnCount, nextDisc, now);

      await squareGateway.insertAll(dbConnection, turnRecord.id, board);

      await moveGateway.insert(dbConnection, turnRecord.id, disc, x, y);
      await dbConnection.commit();
    } finally {
      await dbConnection.end();
    }
  }
}
