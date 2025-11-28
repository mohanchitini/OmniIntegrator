const express = require('express');
const router = express.Router();
const cliqController = require('../controllers/cliqController');

router.post('/command', cliqController.handleCommand);
router.post('/bot', cliqController.handleBotMessage);
router.get('/widget', cliqController.handleWidget);

module.exports = router;
