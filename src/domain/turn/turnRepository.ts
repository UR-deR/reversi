import { toDisc } from './disc';
import { MoveGateway } from '../../dataaccess/moveGateway';
import { SquareGateway } from '../../dataaccess/squareGateway';
import { TurnGateway } from '../../dataaccess/turnGateway';
import { Move } from './move';
import { Point } from './point';
import { Turn } from './turn';
import mysql from 'mysql2/promise';
import { Board } from './board';

const turnGateway = new TurnGateway();
const squareGateway = new SquareGateway();
const moveGateway = new MoveGateway();

export class TurnRepository {
  async findByGameIdAndTurnCount(dbConnection: mysql.Connection, gameId: number, turnCount: number): Promise<Turn> {
    const turnRecord = await turnGateway.findByGameIdAndTurnCount(dbConnection, gameId, turnCount);
    if (!turnRecord) {
      throw new Error(`Turn not found`);
    }

    const squareRecords = await squareGateway.findAllByTurnId(dbConnection, turnRecord.id);

    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squareRecords.forEach((square) => {
      board[square.y][square.x] = square.disc;
    });

    const moveRecord = await moveGateway.findByTurnId(dbConnection, turnRecord.id);

    const move = moveRecord ? new Move(toDisc(moveRecord.disc), new Point(moveRecord.x, moveRecord.y)) : undefined;

    return new Turn(gameId, turnCount, toDisc(turnRecord.nextDisc), move, new Board(board), turnRecord.endAt);
  }

  async save(dbConnection: mysql.Connection, turn: Turn) {
    const turnRecord = await turnGateway.insert(dbConnection, turn.gameId, turn.turnCount, turn.nextDisc, turn.endAt);

    await squareGateway.insertAll(dbConnection, turnRecord.id, turn.board.discs);

    if (turn.move) {
      await moveGateway.insert(dbConnection, turnRecord.id, turn.move.disc, turn.move.point.x, turn.move.point.y);
    }
  }
}
