const { PrismaClient } = require('@prisma/client');
const CliqService = require('../services/cliqService');
const TrelloService = require('../services/trelloService');
const logger = require('../utils/logger');
const { verifyZohoCliqSignature } = require('../utils/verifySignature');

const prisma = new PrismaClient();

const cliqController = {
  handleCommand: async (req, res) => {
    try {
      const { command, arguments: args, user } = req.body;

      logger.info(`Received Cliq command: ${command}`);

      let response = { text: 'Command received', isPublic: true };

      switch (command) {
        case 'trello_connect':
          response = await handleConnectCommand(user);
          response.isPublic = true;
          break;
        
        case 'trello_boards':
          response = await handleBoardsCommand(user);
          response.isPublic = true;
          break;
        
        case 'trello_create_card':
          response = await handleCreateCardCommand(args, user);
          response.isPublic = true;
          break;
        
        case 'trello_mytasks':
          response = await handleMyTasksCommand(user);
          response.isPublic = true;
          break;
        
        case 'trello_summary':
          response = await handleSummaryCommand(user);
          response.isPublic = true;
          break;
        
        default:
          response = {
            text: '❌ Unknown command. Available commands:\n• /trello connect\n• /trello boards\n• /trello create_card\n• /trello mytasks\n• /trello summary',
            isPublic: true
          };
      }

      res.json(response);
    } catch (error) {
      logger.error('Error handling Cliq command:', error.message);
      res.status(500).json({ text: '❌ An error occurred processing your command', isPublic: true });
    }
  },

  handleBotMessage: async (req, res) => {
    try {
      const { message, user } = req.body;

      logger.info(`Bot message from ${user.email}: ${message}`);

      res.json({
        text: `Message received: ${message}`
      });
    } catch (error) {
      logger.error('Error handling bot message:', error.message);
      res.status(500).json({ error: 'Failed to process message' });
    }
  },

  handleWidget: async (req, res) => {
    try {
      const { userId } = req.query;

      const boards = await prisma.trelloBoard.findMany({
        where: { userId },
        include: {
          lists: {
            include: {
              cards: {
                include: {
                  aiInsights: true
                }
              }
            }
          }
        }
      });

      res.json({ boards });
    } catch (error) {
      logger.error('Error fetching widget data:', error.message);
      res.status(500).json({ error: 'Failed to fetch widget data' });
    }
  }
};

async function handleConnectCommand(user) {
  // Construct proper Trello OAuth URL
  const callbackUrl = `https://5a8412b0-a4de-4518-bdde-ab106d3692bb-00-3fl13zlylqo78.janeway.replit.dev/trello-callback.html`;
  const authUrl = `https://trello.com/1/authorize?expiration=never&name=TrelloCliqIntegrator&scope=read,write&response_type=token&key=${process.env.TRELLO_CLIENT_ID}&return_url=${encodeURIComponent(callbackUrl)}`;
  
  return {
    text: `🔗 **Connect to Trello**\n\nClick here to authorize: [Connect Trello](${authUrl})`
  };
}

async function handleBoardsCommand(user) {
  try {
    const userRecord = await prisma.user.findFirst({
      where: { email: user.email }
    });

    if (!userRecord) {
      return { text: '❌ Please connect your Trello account first using `/trello connect`' };
    }

    const tokenRecord = await prisma.trelloToken.findFirst({
      where: { userId: userRecord.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!tokenRecord) {
      return { text: '❌ Please connect your Trello account first using `/trello connect`' };
    }

    const trelloService = new TrelloService(tokenRecord.accessToken);
    const boards = await trelloService.getBoards();

    const boardsList = boards.slice(0, 10).map(board => 
      `• **${board.name}** (${board.id})`
    ).join('\n');

    return {
      text: `📋 **Your Trello Boards:**\n\n${boardsList}`
    };
  } catch (error) {
    logger.error('Error fetching boards:', error.message);
    return { text: '❌ Failed to fetch boards. Please check your Trello connection.' };
  }
}

async function handleCreateCardCommand(args, user) {
  try {
    if (!args || args.length < 2) {
      return {
        text: '❌ Usage: `/trello create_card <list_id> <card_name> [description]`'
      };
    }

    const [listId, ...nameParts] = args;
    const name = nameParts.join(' ');

    const userRecord = await prisma.user.findFirst({
      where: { email: user.email }
    });

    if (!userRecord) {
      return { text: '❌ Please connect your Trello account first' };
    }

    const tokenRecord = await prisma.trelloToken.findFirst({
      where: { userId: userRecord.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!tokenRecord) {
      return { text: '❌ Please connect your Trello account first' };
    }

    const trelloService = new TrelloService(tokenRecord.accessToken);
    const card = await trelloService.createCard(listId, { name });

    return {
      text: `✅ **Card Created Successfully!**\n📋 ${card.name}\n🔗 ${card.url}`
    };
  } catch (error) {
    logger.error('Error creating card:', error.message);
    return { text: '❌ Failed to create card. Please check the list ID and try again.' };
  }
}

async function handleMyTasksCommand(user) {
  try {
    const userRecord = await prisma.user.findFirst({
      where: { email: user.email }
    });

    if (!userRecord) {
      return { text: '❌ Please connect your Trello account first' };
    }

    const cards = await prisma.trelloCard.findMany({
      where: {
        closed: false,
        list: {
          board: {
            userId: userRecord.id
          }
        }
      },
      include: {
        list: true,
        aiInsights: true
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    if (cards.length === 0) {
      return { text: '📭 No tasks found' };
    }

    const tasksList = cards.map(card => {
      const priority = card.aiInsights ? card.aiInsights.priority : 'medium';
      const emoji = priority === 'high' ? '🔴' : priority === 'low' ? '🟢' : '🟡';
      return `${emoji} **${card.name}**\n   📂 ${card.list.name}`;
    }).join('\n\n');

    return {
      text: `📋 **Your Tasks:**\n\n${tasksList}`
    };
  } catch (error) {
    logger.error('Error fetching tasks:', error.message);
    return { text: '❌ Failed to fetch tasks' };
  }
}

async function handleSummaryCommand(user) {
  try {
    const userRecord = await prisma.user.findFirst({
      where: { email: user.email }
    });

    if (!userRecord) {
      return { text: '❌ Please connect your Trello account first' };
    }

    // Get all user's cards for analytics
    const cards = await prisma.trelloCard.findMany({
      where: {
        closed: false,
        list: {
          board: {
            userId: userRecord.id
          }
        }
      },
      include: {
        list: {
          include: {
            board: true
          }
        }
      }
    });

    // Prepare cards data for AI analytics
    const cardsData = cards.map(card => ({
      name: card.name,
      description: card.description || '',
      closed: card.closed,
      dueDate: card.dueDate,
      id: card.id
    }));

    // Call AI microservice for analytics
    let aiAnalytics = null;
    try {
      const aiResponse = await axios.post(
        'http://localhost:8000/analytics',
        { cards: cardsData },
        { timeout: 5000 }
      );
      aiAnalytics = aiResponse.data.analytics;
    } catch (aiError) {
      logger.warn('AI analytics not available:', aiError.message);
    }

    // Build summary response
    let summaryText = `📊 **Trello Summary**\n\n`;
    summaryText += `📋 Total Active Cards: ${cards.length}\n`;
    
    if (aiAnalytics) {
      summaryText += `✅ Completed: ${aiAnalytics.completed}\n`;
      summaryText += `🔴 High Priority: ${aiAnalytics.priority_distribution.high}\n`;
      summaryText += `🟡 Medium Priority: ${aiAnalytics.priority_distribution.medium}\n`;
      summaryText += `🟢 Low Priority: ${aiAnalytics.priority_distribution.low}\n`;
      summaryText += `📈 Productivity Score: ${aiAnalytics.productivity_score}%\n`;
      summaryText += `⏳ Completion Rate: ${aiAnalytics.completion_rate}%`;
    } else {
      summaryText += `⚠️ AI analytics unavailable (running in rule-based mode)`;
    }

    return { text: summaryText };
  } catch (error) {
    logger.error('Error generating summary:', error.message);
    return { text: '❌ Failed to generate summary' };
  }
}

module.exports = cliqController;
