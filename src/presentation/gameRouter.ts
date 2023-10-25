import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';

import { GameService } from '../application/gameService';

const app = express();

app.use(morgan('dev'));
app.use(
  express.static('static', {
    extensions: ['html'],
  })
);
app.use(express.json());

export const gameRouter = express.Router();
const gameService = new GameService();

gameRouter.post('/api/games', async (req, res) => {
  await gameService.startNewGame();

  res.status(201).end();
});
