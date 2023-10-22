import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';
import mysql from 'mysql2/promise';
import { GameGateway } from './dataaccess/gameGateway';
import { TurnGateway } from './dataaccess/turnGateway';
import { MoveGateway } from './dataaccess/moveGateway';
import { SquareGateway } from './dataaccess/squareGateway';

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
];

const app = express();

const PORT = 3000;

app.use(morgan('dev'));
app.use(
  express.static('static', {
    extensions: ['html'],
  })
);
app.use(express.json());

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

app.get('/error', (req, res) => {
  throw new Error('Error!');
});

app.post('/api/games', async (req, res) => {
  const now = new Date();
  const dbConnection = await connectMysql();

  try {
    await dbConnection.beginTransaction();

    const gameRecord = await gameGateway.insert(dbConnection, now);

    const turnRecord = await turnGateway.insert(dbConnection, gameRecord.id, 0, DARK, now);
    await squareGateway.insertAll(dbConnection, turnRecord.id, INITIAL_BOARD);
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

    const responseBody = {
      turnCount,
      board,
      nextDisc: turnRecord.nextDisc,
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
