const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { orderValidation, idValidation } = require('../middleware/validate.middleware');

// All order routes require authentication
router.use(authenticateToken);

router.post('/', orderValidation, orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', idValidation, orderController.getOrderById);
router.patch('/:id/status', idValidation, authorizeRoles('florist', 'admin'), orderController.updateOrderStatus);

module.exports = router;
