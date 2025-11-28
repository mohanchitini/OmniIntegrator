const axios = require('axios');
const logger = require('../utils/logger');

const CLIQ_API_BASE = 'https://cliq.zoho.com/api/v2';

class CliqService {
  constructor(accessToken, botToken = null) {
    this.accessToken = accessToken;
    this.botToken = botToken;
  }

  async sendMessage(chatId, message) {
    try {
      const response = await axios.post(
        `${CLIQ_API_BASE}/chats/${chatId}/message`,
        { text: message },
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`
          }
        }
      );
      logger.info(`Sent message to chat ${chatId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending message to chat ${chatId}:`, error.message);
      throw error;
    }
  }

  async sendBotMessage(chatId, message, card = null) {
    try {
      const payload = {
        text: message
      };

      if (card) {
        payload.card = card;
      }

      const response = await axios.post(
        `${CLIQ_API_BASE}/bots/message`,
        payload,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.botToken || this.accessToken}`
          }
        }
      );
      logger.info(`Sent bot message to chat ${chatId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending bot message:`, error.message);
      throw error;
    }
  }

  async postToChannel(channelId, message) {
    try {
      const response = await axios.post(
        `${CLIQ_API_BASE}/channels/${channelId}/message`,
        { text: message },
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`
          }
        }
      );
      logger.info(`Posted to channel ${channelId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error posting to channel:`, error.message);
      throw error;
    }
  }

  async createCard(title, content, theme = 'modern-inline') {
    return {
      title: title,
      theme: theme,
      thumbnail: {
        url: 'https://www.zoho.com/cliq/help/restapi/images/bot-message.png'
      },
      content: content
    };
  }

  async buildTrelloCardMessage(trelloCard) {
    const card = {
      title: `📋 ${trelloCard.name}`,
      theme: 'modern-inline',
      thumbnail: {
        url: 'https://cdn.iconscout.com/icon/free/png-256/trello-226534.png'
      },
      content: []
    };

    if (trelloCard.desc) {
      card.content.push({
        type: 'text',
        text: trelloCard.desc
      });
    }

    if (trelloCard.due) {
      card.content.push({
        type: 'text',
        text: `⏰ Due: ${new Date(trelloCard.due).toLocaleDateString()}`
      });
    }

    card.content.push({
      type: 'buttons',
      buttons: [{
        label: 'View on Trello',
        type: 'open.url',
        url: trelloCard.url || trelloCard.shortUrl
      }]
    });

    return card;
  }

  async notifyTrelloUpdate(chatId, action, cardName) {
    const messages = {
      'createCard': `✨ New Trello card created: **${cardName}**`,
      'updateCard': `🔄 Trello card updated: **${cardName}**`,
      'deleteCard': `🗑️ Trello card deleted: **${cardName}**`,
      'commentCard': `💬 New comment on: **${cardName}**`
    };

    const message = messages[action] || `📌 Trello update: **${cardName}**`;
    return await this.sendMessage(chatId, message);
  }
}

module.exports = CliqService;
