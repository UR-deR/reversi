import mysql from 'mysql2/promise';
import { GameRecord } from './gameRecord';
export class GameGateway {
  async findLatest(dbConnection: mysql.Connection): Promise<GameRecord | undefined> {
    const [gameSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, started_at FROM games ORDER BY id DESC LIMIT 1'
    );
    const [record] = gameSelectResult;

    if (!record) {
      return undefined;
    }

    return new GameRecord(record.id, record.started_at);
  }

  async insert(dbConnection: mysql.Connection, startedAt: Date): Promise<GameRecord> {
    const [gameInsertResult] = await dbConnection.execute<mysql.ResultSetHeader>(
      'INSERT INTO games (started_at) VALUES (?)',
      [startedAt]
    );
    const gameId = gameInsertResult.insertId;
    return new GameRecord(gameId, startedAt);
  }
}
