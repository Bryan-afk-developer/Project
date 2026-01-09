const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

// Get reviews for a flower (public)
router.get('/flowers/:flowerId/reviews', reviewController.getFlowerReviews);

// Get average rating for a flower (public)
router.get('/flowers/:flowerId/rating', reviewController.getFlowerRating);

// Create review (authenticated)
router.post('/flowers/:flowerId/reviews', authenticateToken, reviewController.createReview);

// Update review (authenticated, owner only)
router.put('/reviews/:id', authenticateToken, reviewController.updateReview);

// Delete review (authenticated, owner only)
router.delete('/reviews/:id', authenticateToken, reviewController.deleteReview);

// Mark review as helpful (public or authenticated)
router.post('/reviews/:id/helpful', reviewController.markHelpful);

module.exports = router;
