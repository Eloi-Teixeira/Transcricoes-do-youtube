import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import summarizerRoute from './routes/summarizerRoute.js';

const app = express();
app.use(express.static('client'));

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

app.use(cors());
app.use(
  cors({
    origin: '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

const limiter = rateLimit({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Muitas requisições. Por favor, tente novamente mais tarde!',
});

app.use('/', limiter);
app.use(express.json({ limit: '10kb' }));
app.use('/api/summarizer', (req, res, next) => {
  if (
    !req.body ||
    !req.body.videoURL ||
    typeof req.body.videoURL !== 'string' ||
    !/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w\-]{11}(\?[\S]*)?$/.test(
      req.body.videoURL,
    )
  ) {
    return res.status(400).json({
      status: false,
      message: 'URL do vídeo não fornecida ou inválida.',
    });
  }
  next();
});
app.use('/api/summarizer', summarizerRoute);

app.all('/', (req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`, 404));
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
