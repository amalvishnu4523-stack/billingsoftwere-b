import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import mainRouter from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());

// Build allowed origins list — includes configured URLs plus all Vercel preview deployments
const VERCEL_PATTERN = /^https:\/\/billingsoftwere-f[a-z0-9\-]*\.vercel\.app$/;

function corsOrigin(origin, callback) {
  // Allow requests with no origin (mobile apps, curl, Postman)
  if (!origin) return callback(null, true);
  // Allow any configured CLIENT_URL
  if (config.clientUrls.includes(origin)) return callback(null, true);
  // Allow all Vercel preview deployments for this project
  if (VERCEL_PATTERN.test(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

if (!config.isProduction) {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProduction ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.isProduction,
});
app.use(globalLimiter);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Industrial ERP API',
    version: '1.0.0',
    description: 'REST API for the Industrial Finishing Products ERP System',
  },
  servers: [{ url: '/api', description: 'API base' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, 'routes/**/*.js'),
    path.join(__dirname, 'controllers/**/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', mainRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

export default app;
