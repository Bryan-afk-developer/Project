const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All profile routes require authentication
router.use(authenticateToken);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);
router.get('/publications', profileController.getUserPublications);
router.get('/stats', profileController.getUserStats);

module.exports = router;
