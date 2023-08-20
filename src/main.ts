import express from 'express';
import morgan from 'morgan';
import 'express-async-errors';
import mysql from 'mysql2/promise';

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
  const startedAt = new Date();
  const dbConnection = await mysql.createConnection({
    host: 'localhost',
    database: 'reversi',
    user: 'reversi',
    password: 'password',
  });

  try {
    await dbConnection.beginTransaction();
    await dbConnection.execute('INSERT INTO games (started_at) VALUES (?)', [startedAt]);
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
