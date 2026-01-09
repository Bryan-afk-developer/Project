const db = require('../config/database');

/**
 * Get reviews for a flower
 */
exports.getFlowerReviews = async (req, res) => {
    try {
        const flowerId = req.params.flowerId;
        const { page = 1, limit = 10, sort = 'recent' } = req.query;

        const offset = (page - 1) * limit;

        let orderBy = 'r.created_at DESC';
        if (sort === 'helpful') orderBy = 'r.helpful_count DESC, r.created_at DESC';
        else if (sort === 'highest') orderBy = 'r.rating DESC, r.created_at DESC';
        else if (sort === 'lowest') orderBy = 'r.rating ASC, r.created_at DESC';

        const reviews = await db.query(`
            SELECT 
                r.id,
                r.rating,
                r.comment,
                r.helpful_count,
                r.created_at,
                r.updated_at,
                u.first_name || ' ' || COALESCE(u.last_name, '') as reviewer_name,
                u.avatar as reviewer_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.flower_id = $1
            ORDER BY ${orderBy}
            LIMIT $2 OFFSET $3
        `, [flowerId, limit, offset]);

        const total = await db.query(
            'SELECT COUNT(*) FROM reviews WHERE flower_id = $1',
            [flowerId]
        );

        res.json({
            success: true,
            data: reviews.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total.rows[0].count),
                totalPages: Math.ceil(total.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Failed to get reviews' });
    }
};

/**
 * Get average rating for a flower
 */
exports.getFlowerRating = async (req, res) => {
    try {
        const flowerId = req.params.flowerId;

        const result = await db.query(`
            SELECT 
                COUNT(id) as review_count,
                COALESCE(AVG(rating), 0) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM reviews
            WHERE flower_id = $1
        `, [flowerId]);

        res.json({
            success: true,
            data: {
                ...result.rows[0],
                average_rating: parseFloat(result.rows[0].average_rating).toFixed(1)
            }
        });
    } catch (error) {
        console.error('Get rating error:', error);
        res.status(500).json({ success: false, message: 'Failed to get rating' });
    }
};

/**
 * Create a review
 */
exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const flowerId = req.params.flowerId;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Check if flower exists
        const flower = await db.query(
            'SELECT * FROM flowers WHERE id = $1',
            [flowerId]
        );

        if (flower.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Flower not found' });
        }

        // Check if user already reviewed this flower
        const existing = await db.query(
            'SELECT * FROM reviews WHERE user_id = $1 AND flower_id = $2',
            [userId, flowerId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this flower' });
        }

        // Create review
        const result = await db.query(`
            INSERT INTO reviews (flower_id, user_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [flowerId, userId, rating, comment]);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, message: 'Failed to create review' });
    }
};

/**
 * Update a review
 */
exports.updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;
        const { rating, comment } = req.body;

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Check if review exists and belongs to user
        const review = await db.query(
            'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
            [reviewId, userId]
        );

        if (review.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found or not authorized' });
        }

        const updates = [];
        const values = [];
        let paramCount = 0;

        if (rating !== undefined) {
            paramCount++;
            updates.push(`rating = $${paramCount}`);
            values.push(rating);
        }

        if (comment !== undefined) {
            paramCount++;
            updates.push(`comment = $${paramCount}`);
            values.push(comment);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No updates provided' });
        }

        paramCount++;
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(reviewId);

        const result = await db.query(`
            UPDATE reviews 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, message: 'Failed to update review' });
    }
};

/**
 * Delete a review
 */
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;

        // Check if review exists and belongs to user
        const review = await db.query(
            'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
            [reviewId, userId]
        );

        if (review.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found or not authorized' });
        }

        await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};

/**
 * Mark review as helpful
 */
exports.markHelpful = async (req, res) => {
    try {
        const reviewId = req.params.id;

        const result = await db.query(`
            UPDATE reviews 
            SET helpful_count = helpful_count + 1
            WHERE id = $1
            RETURNING *
        `, [reviewId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({
            success: true,
            message: 'Review marked as helpful',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark review as helpful' });
    }
};

module.exports = exports;
