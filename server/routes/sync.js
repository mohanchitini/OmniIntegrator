const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const SyncService = require('../services/syncService');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

router.post('/start', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const tokenRecord = await prisma.trelloToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!tokenRecord) {
      return res.status(404).json({ error: 'Trello not connected' });
    }

    const syncService = new SyncService(userId);
    const result = await syncService.syncTrelloToDatabase(tokenRecord.accessToken);

    res.json(result);
  } catch (error) {
    logger.error('Sync error:', error.message);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;

    const syncService = new SyncService(userId);
    const logs = await syncService.getSyncLogs(limit);

    res.json({ logs });
  } catch (error) {
    logger.error('Error fetching sync logs:', error.message);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
});

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const lastSync = await prisma.syncLog.findFirst({
      where: {
        userId,
        action: 'sync_trello'
      },
      orderBy: { createdAt: 'desc' }
    });

    const cardCount = await prisma.trelloCard.count({
      where: {
        list: {
          board: {
            userId
          }
        }
      }
    });

    res.json({
      lastSync: lastSync ? lastSync.createdAt : null,
      status: lastSync ? lastSync.status : 'never_synced',
      totalCards: cardCount
    });
  } catch (error) {
    logger.error('Error fetching sync status:', error.message);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

module.exports = router;
