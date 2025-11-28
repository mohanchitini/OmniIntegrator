const { handleCommand } = require('../bot/bot');

const execute = async (args, user) => {
  return await handleCommand('trello_summary', args, user);
};

module.exports = { execute };
