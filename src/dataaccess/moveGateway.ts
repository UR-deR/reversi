import mysql from 'mysql2/promise';
export class MoveGateway {
  async insert(dbConnection: mysql.Connection, turnId: number, disc: number, x: number, y: number) {
    await dbConnection.execute('INSERT INTO moves (turn_id,disc,x, y) VALUES (?, ?, ?, ?)', [turnId, disc, x, y]);
  }
}
