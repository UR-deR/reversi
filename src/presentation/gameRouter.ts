import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';
import { GameGateway } from '../dataaccess/gameGateway';
import { TurnGateway } from '../dataaccess/turnGateway';
import { SquareGateway } from '../dataaccess/squareGateway';
import { connectMysql } from '../dataaccess/connection';
import { DARK, INITIAL_BOARD } from '../application/constants';

const app = express();

app.use(morgan('dev'));
app.use(
  express.static('static', {
    extensions: ['html'],
  })
);
app.use(express.json());

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const squareGateway = new SquareGateway();

export const gameRouter = express.Router();

gameRouter.post('/api/games', async (req, res) => {
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
