import mysql from 'mysql2/promise';
import { SquareRecord } from './squareRecord';
export class SquareGateway {
  async findAllByTurnId(dbConnection: mysql.Connection, turnId: number): Promise<SquareRecord[]> {
    const squaresSelectResult = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT x, y, disc FROM squares WHERE turn_id = ? ORDER BY y ASC, x ASC',
      [turnId]
    );

    const [records] = squaresSelectResult;

    return records.map(({ id, turnId, x, y, disc }) => new SquareRecord(id, turnId, x, y, disc));
  }

  async insertAll(dbConnection: mysql.Connection, turnId: number, board: number[][]) {
    const squareCount = board.map((row) => row.length).reduce((a, b) => a + b, 0);

    const squaresInsertSql =
      'INSERT INTO squares (turn_id, x, y, disc) VALUES ' +
      Array.from(Array(squareCount))
        .map(() => '(?, ?, ?, ?)')
        .join(', ');

    const squaresInsertValues = board.flatMap((row, y) => row.map((state, x) => [turnId, x, y, state])).flat();
    await dbConnection.execute(squaresInsertSql, squaresInsertValues);
  }
}
