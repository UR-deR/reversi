import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';

import { gameRouter } from './presentation/gameRouter';
import { turnRouter } from './presentation/turnRouter';

const app = express();

const PORT = 3000;

app.use(morgan('dev'));
app.use(
  express.static('static', {
    extensions: ['html'],
  })
);
app.use(express.json());
app.use(gameRouter);
app.use(turnRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function errorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.error(`Error occurred at ${req.method} ${req.url}\n${err.stack}`);
  res.status(500).json({ message: 'Something went wrong' });
}
