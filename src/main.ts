import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';
import mysql from 'mysql2/promise';

const EMPTY = 0;
const DARK = 1;
const LIGHT = 2;

const INITIAL_BOARD = [
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, DARK, LIGHT, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, LIGHT, DARK, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
] as const;

const app = express();

const PORT = 3000;

app.use(morgan('dev'));
app.use(
  express.static('static', {
    extensions: ['html'],
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'Hello!' });
});

app.get('/error', (req, res) => {
  throw new Error('Error!');
});

app.post('/api/games', async (req, res) => {
  const now = new Date();
  const dbConnection = await mysql.createConnection({
    host: 'localhost',
    database: 'reversi',
    user: 'reversi',
    password: 'password',
  });

  try {
    await dbConnection.beginTransaction();

    const [gameInsertResult] = await dbConnection.execute<mysql.ResultSetHeader>(
      'INSERT INTO games (started_at) VALUES (?)',
      [now]
    );

    const gameId = gameInsertResult.insertId;

    const [turnInsertResult] = await dbConnection.execute<mysql.ResultSetHeader>(
      'INSERT INTO turns (game_id, turn_count, next_disc, end_at) VALUES (?, ?, ?, ?)',
      [gameId, 0, DARK, now]
    );

    const turnId = turnInsertResult.insertId;

    const squareCount = INITIAL_BOARD.map((row) => row.length).reduce((a, b) => a + b, 0);

    const squaresInsertSql =
      'INSERT INTO squares (turn_id, x, y, disc) VALUES ' +
      Array.from(Array(squareCount))
        .map(() => '(?, ?, ?, ?)')
        .join(', ');

    const squaresInsertValues = INITIAL_BOARD.flatMap((row, y) => row.map((state, x) => [turnId, x, y, state])).flat();

    await dbConnection.execute(squaresInsertSql, squaresInsertValues);
    await dbConnection.commit();
  } finally {
    await dbConnection.end();
  }

  res.status(201).end();
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function errorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.error(`Error occurred at ${req.method} ${req.url}\n${err.stack}`);
  res.status(500).json({ message: 'Something went wrong' });
}
