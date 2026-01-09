const express = require('express');
const router = express.Router();
const flowerController = require('../controllers/flower.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { flowerValidation, idValidation } = require('../middleware/validate.middleware');

// Public routes
router.get('/', flowerController.getAllFlowers);
router.get('/:id', idValidation, flowerController.getFlowerById);
router.get('/user/:userId', flowerController.getFlowersByUser);

// Protected routes (authentication required)
router.post('/', authenticateToken, flowerValidation, flowerController.createFlower);
router.put('/:id', authenticateToken, idValidation, flowerController.updateFlower);
router.delete('/:id', authenticateToken, idValidation, flowerController.deleteFlower);

module.exports = router;
