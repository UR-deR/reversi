import { MoveGateway } from './../dataaccess/moveGateway';
import express from 'express';
import { connectMysql } from '../dataaccess/connection';
import { GameGateway } from '../dataaccess/gameGateway';
import { TurnGateway } from '../dataaccess/turnGateway';
import { SquareGateway } from '../dataaccess/squareGateway';
import { DARK, LIGHT } from '../application/constants';

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

export const turnRouter = express.Router();

turnRouter.get('/api/games/latest/turns/:turnCount', async (req, res) => {
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

turnRouter.post('/api/games/latest/turns', async (req, res) => {
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
