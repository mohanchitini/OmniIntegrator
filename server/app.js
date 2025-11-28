require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const trelloRoutes = require('./routes/trello');
const cliqRoutes = require('./routes/cliq');
const syncRoutes = require('./routes/sync');

const trelloController = require('./controllers/trelloController');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    name: 'Trello ⇆ Zoho Cliq AI Integrator',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth/*',
      trello: '/api/trello/*',
      cliq: '/api/cliq/*',
      sync: '/api/sync/*',
      webhook: '/webhook/trello'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', error.message);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/trello', trelloRoutes);
app.use('/api/cliq', cliqRoutes);
app.use('/api/sync', syncRoutes);

app.post('/webhook/trello', trelloController.handleWebhook);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

cron.schedule('*/5 * * * *', async () => {
  logger.info('Scheduled sync task - implementation pending');
});

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
      logger.info(`📋 Trello ⇆ Zoho Cliq Integration Active`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
