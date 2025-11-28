const axios = require('axios');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

const handleBotMessage = async (message, user) => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/cliq/bot`, {
      message: message.text,
      user: user
    });

    return response.data;
  } catch (error) {
    console.error('Error handling bot message:', error);
    return {
      text: '❌ An error occurred while processing your message.'
    };
  }
};

const sendTrelloUpdate = async (chatId, update) => {
  try {
    const message = formatTrelloUpdate(update);
    return {
      text: message
    };
  } catch (error) {
    console.error('Error sending Trello update:', error);
    return null;
  }
};

const formatTrelloUpdate = (update) => {
  const { action, cardName, listName, boardName } = update;
  
  const emoji = {
    'created': '✨',
    'updated': '🔄',
    'moved': '↔️',
    'deleted': '🗑️',
    'commented': '💬'
  };

  return `${emoji[action] || '📌'} **Trello Update**\n` +
         `📋 ${cardName}\n` +
         `📂 ${listName} > ${boardName}`;
};

const handleCommand = async (command, args, user) => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/cliq/command`, {
      command,
      arguments: args,
      user
    });

    return response.data;
  } catch (error) {
    console.error('Error handling command:', error);
    return {
      text: '❌ Command execution failed. Please try again.'
    };
  }
};

module.exports = {
  handleBotMessage,
  sendTrelloUpdate,
  handleCommand
};
