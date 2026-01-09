const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All favorite routes require authentication
router.use(authenticateToken);

router.get('/', favoriteController.getUserFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:flowerId', favoriteController.removeFavorite);
router.get('/:flowerId/check', favoriteController.isFavorited);

module.exports = router;
