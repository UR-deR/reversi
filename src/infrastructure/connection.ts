import mysql from 'mysql2/promise';

export async function connectMysql() {
  const dbConnection = await mysql.createConnection({
    host: 'localhost',
    database: 'reversi',
    user: 'reversi',
    password: 'password',
  });

  return dbConnection;
}
