import express from 'express';
import { TurnSerivce } from '../application/turnService';

export const turnRouter = express.Router();
const turnService = new TurnSerivce();

turnRouter.get('/api/games/latest/turns/:turnCount', async (req, res) => {
  const turnCount = parseInt(req.params.turnCount, 10);
  const output = await turnService.findLatestGameTurnByTurnCount(turnCount);
  res.json(output);
});

turnRouter.post('/api/games/latest/turns', async (req, res) => {
  const turnCount = parseInt(req.body.turnCount, 10);
  const disc = parseInt(req.body.move.disc, 10);
  const x = parseInt(req.body.move.x, 10);
  const y = parseInt(req.body.move.y, 10);

  await turnService.registerTurn(turnCount, disc, x, y);

  res.status(201).end();
});
