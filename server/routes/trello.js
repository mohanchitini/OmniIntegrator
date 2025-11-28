const express = require('express');
const router = express.Router();
const trelloController = require('../controllers/trelloController');
const { authMiddleware } = require('../middleware/auth');

router.get('/boards', authMiddleware, trelloController.getBoards);
router.get('/lists/:boardId', authMiddleware, trelloController.getLists);
router.get('/cards/:listId', authMiddleware, trelloController.getCards);
router.post('/create_card', authMiddleware, trelloController.createCard);
router.post('/sync', authMiddleware, trelloController.syncTrello);
router.get('/dashboard/:boardId', authMiddleware, trelloController.getDashboard);

module.exports = router;
