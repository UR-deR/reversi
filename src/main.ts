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
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello!' });
});

app.get('/error', (req, res) => {
  throw new Error('Error!');
});

app.post('/api/games', async (req, res) => {
  const now = new Date();
  const dbConnection = await connectMysql();

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

app.get('/api/games/latest/turns/:turnCount', async (req, res) => {
  const turnCount = parseInt(req.params.turnCount, 10);
  const dbConnection = await connectMysql();

  try {
    const [gameSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, started_at FROM games ORDER BY id DESC LIMIT 1'
    );

    const [game] = gameSelectResult;

    const [turnSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, turn_count, next_disc, end_at FROM turns WHERE game_id = ? AND turn_count = ?',
      [game.id, turnCount]
    );

    const [turn] = turnSelectResult;

    const squaresSelectResult = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT x, y, disc FROM squares WHERE turn_id = ? ORDER BY y ASC, x ASC',
      [turn.id]
    );

    const [squares] = squaresSelectResult;

    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squares.forEach((square) => {
      board[square.y][square.x] = square.disc;
    });

    const responseBody = {
      turnCount,
      board,
      nextDisc: turn.next_disc,
      winnerDisc: null,
    };

    res.json(responseBody);
  } finally {
    await dbConnection.end();
  }
});

app.post('/api/games/latest/turns', async (req, res) => {
  const turnCount = parseInt(req.body.turnCount, 10);
  const disc = parseInt(req.body.move.disc, 10);
  const x = parseInt(req.body.move.x, 10);
  const y = parseInt(req.body.move.y, 10);

  const dbConnection = await connectMysql();

  try {
    const [gameSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, started_at FROM games ORDER BY id DESC LIMIT 1'
    );

    const [game] = gameSelectResult;

    const previousTurnCount = turnCount - 1;

    const [turnSelectResult] = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT id, turn_count, next_disc, end_at FROM turns WHERE game_id = ? AND turn_count = ?',
      [game.id, previousTurnCount]
    );

    const [turn] = turnSelectResult;

    const squaresSelectResult = await dbConnection.execute<mysql.RowDataPacket[]>(
      'SELECT x, y, disc FROM squares WHERE turn_id = ? ORDER BY y ASC, x ASC',
      [turn.id]
    );

    const [squares] = squaresSelectResult;

    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squares.forEach((square) => {
      board[square.y][square.x] = square.disc;
    });

    board[y][x] = disc;

    const now = new Date();
    const nextDisc = disc === DARK ? LIGHT : DARK;
    const [turnInsertResult] = await dbConnection.execute<mysql.ResultSetHeader>(
      'INSERT INTO turns (game_id, turn_count, next_disc, end_at) VALUES (?, ?, ?, ?)',
      [game.id, turnCount, nextDisc, now]
    );

    const turnId = turnInsertResult.insertId;

    const squareCount = board.map((row) => row.length).reduce((a, b) => a + b, 0);

    const squaresInsertSql =
      'INSERT INTO squares (turn_id, x, y, disc) VALUES ' +
      Array.from(Array(squareCount))
        .map(() => '(?, ?, ?, ?)')
        .join(', ');

    const squaresInsertValues = board.flatMap((row, y) => row.map((state, x) => [turnId, x, y, state])).flat();

    await dbConnection.execute(squaresInsertSql, squaresInsertValues);
    await dbConnection.execute('INSERT INTO moves (turn_id,disc,x, y) VALUES (?, ?, ?, ?)', [turnId, disc, x, y]);
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

async function connectMysql() {
  const dbConnection = await mysql.createConnection({
    host: 'localhost',
    database: 'reversi',
    user: 'reversi',
    password: 'password',
  });

  return dbConnection;
}
