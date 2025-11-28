const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/trello', authController.getTrelloAuthUrl);
router.post('/trello/callback', authController.handleTrelloCallback);

router.get('/cliq', authController.getCliqAuthUrl);
router.post('/cliq/callback', authController.handleCliqCallback);

router.post('/verify', authController.verifyToken);

module.exports = router;
