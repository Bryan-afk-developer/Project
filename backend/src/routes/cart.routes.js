const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All cart routes require authentication
router.use(authenticateToken);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', cartController.addItem);

// Update cart item quantity
router.put('/items/:id', cartController.updateItem);

// Remove item from cart
router.delete('/items/:id', cartController.removeItem);

// Clear entire cart
router.delete('/', cartController.clearCart);

// Checkout (create order from cart)
router.post('/checkout', cartController.checkout);

module.exports = router;
