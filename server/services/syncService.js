const { PrismaClient } = require('@prisma/client');
const TrelloService = require('./trelloService');
const CliqService = require('./cliqService');
const AIService = require('./aiService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class SyncService {
  constructor(userId) {
    this.userId = userId;
    this.aiService = new AIService();
  }

  async syncTrelloToDatabase(trelloToken) {
    try {
      logger.info(`Starting sync for user ${this.userId}`);
      const trelloService = new TrelloService(trelloToken);
      
      const boards = await trelloService.getBoards();
      
      for (const board of boards) {
        await prisma.trelloBoard.upsert({
          where: { id: board.id },
          update: {
            name: board.name,
            description: board.desc,
            url: board.url,
            closed: board.closed,
            userId: this.userId
          },
          create: {
            id: board.id,
            userId: this.userId,
            name: board.name,
            description: board.desc,
            url: board.url,
            closed: board.closed
          }
        });

        const lists = await trelloService.getLists(board.id);
        
        for (const list of lists) {
          await prisma.trelloList.upsert({
            where: { id: list.id },
            update: {
              name: list.name,
              position: list.pos,
              closed: list.closed
            },
            create: {
              id: list.id,
              boardId: board.id,
              name: list.name,
              position: list.pos,
              closed: list.closed
            }
          });

          const cards = await trelloService.getCards(list.id);
          
          for (const card of cards) {
            await prisma.trelloCard.upsert({
              where: { id: card.id },
              update: {
                name: card.name,
                description: card.desc,
                dueDate: card.due ? new Date(card.due) : null,
                labels: JSON.stringify(card.labels),
                members: JSON.stringify(card.idMembers),
                position: card.pos,
                closed: card.closed,
                url: card.url
              },
              create: {
                id: card.id,
                listId: list.id,
                name: card.name,
                description: card.desc,
                dueDate: card.due ? new Date(card.due) : null,
                labels: JSON.stringify(card.labels),
                members: JSON.stringify(card.idMembers),
                position: card.pos,
                closed: card.closed,
                url: card.url
              }
            });

            const insights = await this.aiService.generateInsights(card.id, card);
            if (insights) {
              await prisma.aIInsights.upsert({
                where: { cardId: card.id },
                update: {
                  summary: insights.summary,
                  priority: insights.priority,
                  sentiment: insights.sentiment,
                  tags: insights.tags
                },
                create: {
                  cardId: card.id,
                  summary: insights.summary,
                  priority: insights.priority,
                  sentiment: insights.sentiment,
                  tags: insights.tags
                }
              });
            }
          }
        }
      }

      await this.logSync('sync_trello', 'trello', 'database', 'success', 'Full sync completed');
      logger.info(`Sync completed for user ${this.userId}`);
      
      return { success: true, boards: boards.length };
    } catch (error) {
      logger.error(`Sync failed for user ${this.userId}:`, error.message);
      await this.logSync('sync_trello', 'trello', 'database', 'failed', error.message);
      throw error;
    }
  }

  async notifyCliq(cliqToken, updates) {
    try {
      const cliqService = new CliqService(cliqToken);
      
      for (const update of updates) {
        const message = this.formatUpdateMessage(update);
        await cliqService.sendMessage(update.chatId, message);
      }

      await this.logSync('notify_cliq', 'database', 'cliq', 'success', `Sent ${updates.length} notifications`);
      
      return { success: true, count: updates.length };
    } catch (error) {
      logger.error('Error notifying Cliq:', error.message);
      await this.logSync('notify_cliq', 'database', 'cliq', 'failed', error.message);
      throw error;
    }
  }

  formatUpdateMessage(update) {
    const { action, cardName, listName, boardName } = update;
    
    const messages = {
      'created': `✨ **New Card Created**\n📋 ${cardName}\n📂 ${listName} > ${boardName}`,
      'updated': `🔄 **Card Updated**\n📋 ${cardName}\n📂 ${listName} > ${boardName}`,
      'moved': `↔️ **Card Moved**\n📋 ${cardName}\n📂 ${listName} > ${boardName}`,
      'deleted': `🗑️ **Card Deleted**\n📋 ${cardName}\n📂 ${boardName}`
    };

    return messages[action] || `📌 **Trello Update**\n${cardName}`;
  }

  async logSync(action, source, target, status, details) {
    try {
      await prisma.syncLog.create({
        data: {
          userId: this.userId,
          action,
          source,
          target,
          status,
          details
        }
      });
    } catch (error) {
      logger.error('Error logging sync:', error.message);
    }
  }

  async getSyncLogs(limit = 50) {
    try {
      return await prisma.syncLog.findMany({
        where: { userId: this.userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Error fetching sync logs:', error.message);
      return [];
    }
  }

  async getDashboardData(boardId) {
    try {
      const lists = await prisma.trelloList.findMany({
        where: { boardId },
        include: {
          cards: {
            include: {
              aiInsights: true
            }
          }
        },
        orderBy: { position: 'asc' }
      });

      const analytics = {
        totalCards: 0,
        completedCards: 0,
        urgentCards: 0,
        overdueTasks: 0
      };

      lists.forEach(list => {
        analytics.totalCards += list.cards.length;
        list.cards.forEach(card => {
          if (list.name.toLowerCase().includes('done')) {
            analytics.completedCards++;
          }
          if (card.aiInsights && card.aiInsights.priority === 'high') {
            analytics.urgentCards++;
          }
          if (card.dueDate && new Date(card.dueDate) < new Date()) {
            analytics.overdueTasks++;
          }
        });
      });

      return {
        lists,
        analytics
      };
    } catch (error) {
      logger.error('Error fetching dashboard data:', error.message);
      throw error;
    }
  }
}

module.exports = SyncService;
