const { PrismaClient } = require('@prisma/client');
const TrelloService = require('../services/trelloService');
const SyncService = require('../services/syncService');
const CliqService = require('../services/cliqService');
const logger = require('../utils/logger');
const { verifyTrelloWebhook } = require('../utils/verifySignature');

const prisma = new PrismaClient();

const trelloController = {
  getBoards: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const tokenRecord = await prisma.trelloToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!tokenRecord) {
        return res.status(404).json({ error: 'Trello not connected' });
      }

      const trelloService = new TrelloService(tokenRecord.accessToken);
      const boards = await trelloService.getBoards();

      logger.info(`Fetched ${boards.length} boards for user ${userId}`);
      res.json({ boards });
    } catch (error) {
      logger.error('Error fetching boards:', error.message);
      res.status(500).json({ error: 'Failed to fetch boards' });
    }
  },

  getLists: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { boardId } = req.params;

      const tokenRecord = await prisma.trelloToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!tokenRecord) {
        return res.status(404).json({ error: 'Trello not connected' });
      }

      const trelloService = new TrelloService(tokenRecord.accessToken);
      const lists = await trelloService.getLists(boardId);

      res.json({ lists });
    } catch (error) {
      logger.error('Error fetching lists:', error.message);
      res.status(500).json({ error: 'Failed to fetch lists' });
    }
  },

  getCards: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { listId } = req.params;

      const tokenRecord = await prisma.trelloToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!tokenRecord) {
        return res.status(404).json({ error: 'Trello not connected' });
      }

      const trelloService = new TrelloService(tokenRecord.accessToken);
      const cards = await trelloService.getCards(listId);

      res.json({ cards });
    } catch (error) {
      logger.error('Error fetching cards:', error.message);
      res.status(500).json({ error: 'Failed to fetch cards' });
    }
  },

  createCard: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { listId, name, description, dueDate } = req.body;

      if (!listId || !name) {
        return res.status(400).json({ error: 'listId and name are required' });
      }

      const tokenRecord = await prisma.trelloToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!tokenRecord) {
        return res.status(404).json({ error: 'Trello not connected' });
      }

      const trelloService = new TrelloService(tokenRecord.accessToken);
      const card = await trelloService.createCard(listId, {
        name,
        description,
        dueDate
      });

      const cliqTokenRecord = await prisma.cliqToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (cliqTokenRecord) {
        const cliqService = new CliqService(cliqTokenRecord.accessToken);
        const cardMessage = await cliqService.buildTrelloCardMessage(card);
        logger.info('Notified Cliq about new card');
      }

      logger.info(`Created card: ${name}`);
      res.json({ success: true, card });
    } catch (error) {
      logger.error('Error creating card:', error.message);
      res.status(500).json({ error: 'Failed to create card' });
    }
  },

  syncTrello: async (req, res) => {
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
      logger.error('Error syncing Trello:', error.message);
      res.status(500).json({ error: 'Sync failed' });
    }
  },

  handleWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-trello-webhook'];
      
      if (signature) {
        const isValid = verifyTrelloWebhook(req.body, signature, process.env.TRELLO_CLIENT_SECRET);
        if (!isValid) {
          return res.status(403).json({ error: 'Invalid signature' });
        }
      }

      const { action } = req.body;

      if (action && action.type === 'createCard') {
        const card = action.data.card;
        const list = action.data.list;
        
        logger.info(`Webhook: New card created - ${card.name}`);
      } else if (action && action.type === 'updateCard') {
        logger.info(`Webhook: Card updated - ${action.data.card.name}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling webhook:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  getDashboard: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { boardId } = req.params;

      const syncService = new SyncService(userId);
      const dashboardData = await syncService.getDashboardData(boardId);

      res.json(dashboardData);
    } catch (error) {
      logger.error('Error fetching dashboard data:', error.message);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
};

module.exports = trelloController;
