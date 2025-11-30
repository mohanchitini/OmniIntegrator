const axios = require('axios');
const logger = require('../utils/logger');

const TRELLO_API_BASE = 'https://api.trello.com/1';

class TrelloService {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async getBoards() {
    try {
      const key = process.env.TRELLO_CLIENT_ID?.trim();
      const token = this.accessToken?.trim();
      
      logger.info('TrelloService - Fetching boards:', {
        hasToken: !!token,
        hasKey: !!key,
        apiKey: key ? `${key.substring(0, 8)}...` : 'missing',
        token: token ? `${token.substring(0, 8)}...` : 'missing'
      });
      
      const response = await axios.get(`${TRELLO_API_BASE}/members/me/boards`, {
        params: {
          token: token,
          key: key
        }
      });
      logger.info('✅ Fetched Trello boards successfully');
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      logger.error('❌ Error fetching Trello boards:', {
        status,
        message: data?.message || error.message,
        url: error.config?.url,
        params: error.config?.params
      });
      throw error;
    }
  }

  async getLists(boardId) {
    try {
      const response = await axios.get(`${TRELLO_API_BASE}/boards/${boardId}/lists`, {
        params: {
          token: this.accessToken,
          key: process.env.TRELLO_CLIENT_ID
        }
      });
      logger.info(`Fetched lists for board ${boardId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching lists for board ${boardId}:`, error.message);
      throw error;
    }
  }

  async getCards(listId) {
    try {
      const response = await axios.get(`${TRELLO_API_BASE}/lists/${listId}/cards`, {
        params: {
          token: this.accessToken,
          key: process.env.TRELLO_CLIENT_ID
        }
      });
      logger.info(`Fetched cards for list ${listId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching cards for list ${listId}:`, error.message);
      throw error;
    }
  }

  async getCard(cardId) {
    try {
      const response = await axios.get(`${TRELLO_API_BASE}/cards/${cardId}`, {
        params: {
          token: this.accessToken,
          key: process.env.TRELLO_CLIENT_ID
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching card ${cardId}:`, error.message);
      throw error;
    }
  }

  async createCard(listId, cardData) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/cards`, {
        idList: listId,
        name: cardData.name,
        desc: cardData.description || '',
        due: cardData.dueDate || null,
        pos: cardData.position || 'bottom',
        token: this.accessToken,
        key: process.env.TRELLO_CLIENT_ID
      });
      logger.info(`Created card in list ${listId}: ${cardData.name}`);
      return response.data;
    } catch (error) {
      logger.error(`Error creating card in list ${listId}:`, error.message);
      throw error;
    }
  }

  async updateCard(cardId, updates) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}`, {
        ...updates,
        token: this.accessToken,
        key: process.env.TRELLO_CLIENT_ID
      });
      logger.info(`Updated card ${cardId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error updating card ${cardId}:`, error.message);
      throw error;
    }
  }

  async createWebhook(callbackURL, idModel) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/webhooks`, {
        callbackURL,
        idModel,
        description: 'Trello-Cliq Integration Webhook',
        token: this.accessToken,
        key: process.env.TRELLO_CLIENT_ID
      });
      logger.info(`Created webhook for model ${idModel}`);
      return response.data;
    } catch (error) {
      logger.error(`Error creating webhook:`, error.message);
      throw error;
    }
  }

  async getBoardCards(boardId) {
    try {
      const response = await axios.get(`${TRELLO_API_BASE}/boards/${boardId}/cards`, {
        params: {
          token: this.accessToken,
          key: process.env.TRELLO_CLIENT_ID
        }
      });
      logger.info(`Fetched all cards for board ${boardId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching board cards:`, error.message);
      throw error;
    }
  }
}

module.exports = TrelloService;
