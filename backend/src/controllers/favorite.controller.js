const db = require('../config/database');

/**
 * Add flower to favorites
 */
exports.addFavorite = async (req, res) => {
    const { flower_id } = req.body;
    const userId = req.user.id;

    try {
        // Check if flower exists
        const flowerCheck = await db.query(
            'SELECT id FROM flowers WHERE id = $1',
            [flower_id]
        );

        if (flowerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flower not found'
            });
        }

        // Add to favorites (ON CONFLICT handles duplicates)
        const result = await db.query(
            `INSERT INTO favorites (user_id, flower_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, flower_id) DO NOTHING
             RETURNING *`,
            [userId, flower_id]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Already in favorites'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Added to favorites',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add favorite',
            error: error.message
        });
    }
};

/**
 * Remove flower from favorites
 */
exports.removeFavorite = async (req, res) => {
    const { flowerId } = req.params;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'DELETE FROM favorites WHERE user_id = $1 AND flower_id = $2 RETURNING *',
            [userId, flowerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove favorite',
            error: error.message
        });
    }
};

/**
 * Get all favorites for authenticated user
 */
exports.getUserFavorites = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            `SELECT f.*, fav.created_at as favorited_at,
                    c.name as category_name,
                    u.first_name || ' ' || COALESCE(u.last_name, '') as seller_name
             FROM favorites fav
             JOIN flowers f ON fav.flower_id = f.id
             JOIN categories c ON f.category_id = c.id
             JOIN users u ON f.user_id = u.id
             WHERE fav.user_id = $1
             ORDER BY fav.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch favorites',
            error: error.message
        });
    }
};

/**
 * Check if flower is favorited by user
 */
exports.isFavorited = async (req, res) => {
    const { flowerId } = req.params;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND flower_id = $2',
            [userId, flowerId]
        );

        res.json({
            success: true,
            data: {
                is_favorited: result.rows.length > 0
            }
        });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check favorite status',
            error: error.message
        });
    }
};
