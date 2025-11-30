const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Direct token endpoint (bypasses OAuth callback complexity)
router.post('/trello/token', authController.handleTrelloToken);
router.post('/trello/sync', authController.syncTrelloData);

router.get('/trello', authController.getTrelloAuthUrl);
router.post('/trello/callback', authController.handleTrelloCallback);

router.get('/cliq', authController.getCliqAuthUrl);
router.get('/cliq/callback', authController.handleCliqCallback);
router.post('/cliq/callback', authController.handleCliqCallback);

router.post('/verify', authController.verifyToken);

module.exports = router;
