const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { idValidation } = require('../middleware/validate.middleware');

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', idValidation, notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
