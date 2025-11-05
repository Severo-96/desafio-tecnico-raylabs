import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './api/routes.js';
import { errorHandler } from './middlewares/error-handler.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api', routes);

app.use(errorHandler);

export default app;
