const { handleCommand } = require('../bot/bot');

const execute = async (args, user) => {
  return await handleCommand('trello_mytasks', args, user);
};

module.exports = { execute };
