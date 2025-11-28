const AIService = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const aiService = new AIService();

const aiController = {
  summarize: async (req, res) => {
    try {
      const { text, cardId } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const summary = await aiService.summarize(text);

      if (cardId) {
        await prisma.aIInsights.upsert({
          where: { cardId },
          update: { summary },
          create: {
            cardId,
            summary
          }
        });
      }

      res.json({ summary });
    } catch (error) {
      logger.error('Error generating summary:', error.message);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  },

  extractTasks: async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const tasks = await aiService.extractTasks(text);

      res.json({ tasks });
    } catch (error) {
      logger.error('Error extracting tasks:', error.message);
      res.status(500).json({ error: 'Failed to extract tasks' });
    }
  },

  analyzePriority: async (req, res) => {
    try {
      const { cardId } = req.body;

      if (!cardId) {
        return res.status(400).json({ error: 'Card ID is required' });
      }

      const card = await prisma.trelloCard.findUnique({
        where: { id: cardId }
      });

      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const priority = await aiService.analyzePriority(card);

      await prisma.aIInsights.upsert({
        where: { cardId },
        update: { priority },
        create: {
          cardId,
          priority
        }
      });

      res.json({ priority });
    } catch (error) {
      logger.error('Error analyzing priority:', error.message);
      res.status(500).json({ error: 'Failed to analyze priority' });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const userId = req.user.userId;

      const cards = await prisma.trelloCard.findMany({
        where: {
          list: {
            board: {
              userId
            }
          }
        },
        include: {
          aiInsights: true
        }
      });

      const analytics = await aiService.getAnalytics(cards);

      res.json({ analytics });
    } catch (error) {
      logger.error('Error generating analytics:', error.message);
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  },

  generateInsights: async (req, res) => {
    try {
      const { cardId } = req.body;

      if (!cardId) {
        return res.status(400).json({ error: 'Card ID is required' });
      }

      const card = await prisma.trelloCard.findUnique({
        where: { id: cardId }
      });

      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const insights = await aiService.generateInsights(cardId, card);

      res.json({ insights });
    } catch (error) {
      logger.error('Error generating insights:', error.message);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }
};

module.exports = aiController;
