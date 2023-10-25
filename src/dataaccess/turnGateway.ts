import { TurnRecord } from './turnRecord';
import mysql from 'mysql2/promise';

export class TurnGateway {
  async findForGameAndTurnCount(
    dbConnection: mysql.Connection,
    gameId: number,
    turnCount: number
  ): Promise<TurnRecord | undefined> {
    const [turnSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, turn_count, next_disc, end_at FROM turns WHERE game_id = ? AND turn_count = ?',
      [gameId, turnCount]
    );

    const [record] = turnSelectResult;
    if (!record) {
      return undefined;
    }
    return new TurnRecord(record.id, record.game_id, record.turn_count, record.next_disc, record.end_at);
  }

  async insert(
    dbConnection: mysql.Connection,
    gameId: number,
    turnCount: number,
    nextDisc: number,
    endAt: Date
  ): Promise<TurnRecord> {
    const [turnInsertResult] = await dbConnection.execute<mysql.ResultSetHeader>(
      'INSERT INTO turns (game_id, turn_count, next_disc, end_at) VALUES (?, ?, ?, ?)',
      [gameId, turnCount, nextDisc, endAt]
    );
    const turnId = turnInsertResult.insertId;
    return new TurnRecord(turnId, gameId, turnCount, nextDisc, endAt);
  }
}
