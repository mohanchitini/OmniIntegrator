const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async summarize(text) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/summarize`, {
        text: text
      });
      logger.info('Generated AI summary');
      return response.data.summary;
    } catch (error) {
      logger.error('Error generating summary:', error.message);
      return null;
    }
  }

  async extractTasks(text) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/extract_tasks`, {
        text: text
      });
      logger.info('Extracted tasks from text');
      return response.data.tasks;
    } catch (error) {
      logger.error('Error extracting tasks:', error.message);
      return [];
    }
  }

  async analyzePriority(cardData) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/priority`, {
        card: cardData
      });
      logger.info('Analyzed card priority');
      return response.data.priority;
    } catch (error) {
      logger.error('Error analyzing priority:', error.message);
      return 'medium';
    }
  }

  async getAnalytics(cards) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/analytics`, {
        cards: cards
      });
      logger.info('Generated analytics');
      return response.data.analytics;
    } catch (error) {
      logger.error('Error generating analytics:', error.message);
      return null;
    }
  }

  async generateInsights(cardId, cardData) {
    try {
      const summary = await this.summarize(cardData.desc || cardData.name);
      const priority = await this.analyzePriority(cardData);
      
      return {
        cardId,
        summary,
        priority,
        sentiment: this.analyzeSentiment(cardData),
        tags: this.extractTags(cardData)
      };
    } catch (error) {
      logger.error('Error generating insights:', error.message);
      return null;
    }
  }

  analyzeSentiment(cardData) {
    const text = `${cardData.name} ${cardData.desc || ''}`.toLowerCase();
    
    if (text.match(/urgent|critical|asap|important/)) {
      return 'urgent';
    } else if (text.match(/bug|error|issue|problem|fix/)) {
      return 'negative';
    } else if (text.match(/feature|improve|enhance|add/)) {
      return 'positive';
    }
    
    return 'neutral';
  }

  extractTags(cardData) {
    const tags = [];
    const text = `${cardData.name} ${cardData.desc || ''}`.toLowerCase();
    
    if (text.match(/bug|error|issue/)) tags.push('bug');
    if (text.match(/feature|enhancement/)) tags.push('feature');
    if (text.match(/urgent|critical|asap/)) tags.push('urgent');
    if (text.match(/design|ui|ux/)) tags.push('design');
    if (text.match(/backend|api|server/)) tags.push('backend');
    if (text.match(/frontend|client/)) tags.push('frontend');
    
    return tags.join(',');
  }
}

module.exports = AIService;
