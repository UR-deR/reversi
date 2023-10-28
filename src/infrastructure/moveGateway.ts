import mysql from 'mysql2/promise';
import { moveRecord } from './moveRecord';
export class MoveGateway {
  async insert(dbConnection: mysql.Connection, turnId: number, disc: number, x: number, y: number) {
    await dbConnection.execute('INSERT INTO moves (turn_id,disc,x, y) VALUES (?, ?, ?, ?)', [turnId, disc, x, y]);
  }

  async findByTurnId(dbConnection: mysql.Connection, turnId: number): Promise<moveRecord | undefined> {
    const [moveSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, turn_id, disc, x, y FROM moves WHERE turn_id = ?',
      [turnId]
    );
    const [record] = moveSelectResult;

    if (!record) {
      return undefined;
    }

    return new moveRecord(record.id, record.turn_id, record.disc, record.x, record.y);
  }
}
