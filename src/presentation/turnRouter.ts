import express from 'express';
import { TurnSerivce } from '../application/turnService';

export const turnRouter = express.Router();
const turnService = new TurnSerivce();

interface GetTurnResponse {
  turnCount: number;
  board: number[][];
  nextDisc: number | null;
  winnerDisc: number | null;
}

turnRouter.get('/api/games/latest/turns/:turnCount', async (req, res: express.Response<GetTurnResponse>) => {
  const turnCount = parseInt(req.params.turnCount, 10);
  const latestGameTurn = await turnService.findLatestGameTurnByTurnCount(turnCount);
  const responseBody = {
    turnCount: latestGameTurn.turnCount,
    board: latestGameTurn.board,
    nextDisc: latestGameTurn.nextDisc ?? null,
    winnerDisc: latestGameTurn.winnerDisc ?? null,
  };
  res.json(responseBody);
});

interface RegisterTurnRequest {
  turnCount: number;
  move: {
    disc: number;
    x: number;
    y: number;
  };
}

turnRouter.post('/api/games/latest/turns', async (req: express.Request<{}, {}, RegisterTurnRequest>, res) => {
  const turnCount = req.body.turnCount;
  const disc = req.body.move.disc;
  const x = req.body.move.x;
  const y = req.body.move.y;

  await turnService.registerTurn(turnCount, disc, x, y);

  res.status(201).end();
});
