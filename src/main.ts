import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';

const app = express();

const PORT = 3000;

app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'Hello!' });
});

app.get('/error', (req, res) => {
  throw new Error('Error!');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function errorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.error(`Error occurred at ${req.method} ${req.url}\n${err.stack}`);
  res.status(500).json({ message: 'Something went wrong' });
}
