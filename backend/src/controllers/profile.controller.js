const db = require('../config/database');

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            `SELECT id, email, first_name, last_name, phone, avatar, bio, role, 
                    email_verified, created_at, updated_at
             FROM users 
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, phone, avatar, bio } = req.body;

    try {
        const updates = [];
        const params = [];
        let paramCount = 0;

        if (first_name !== undefined) {
            paramCount++;
            updates.push(`first_name = $${paramCount}`);
            params.push(first_name);
        }
        if (last_name !== undefined) {
            paramCount++;
            updates.push(`last_name = $${paramCount}`);
            params.push(last_name);
        }
        if (phone !== undefined) {
            paramCount++;
            updates.push(`phone = $${paramCount}`);
            params.push(phone);
        }
        if (avatar !== undefined) {
            paramCount++;
            updates.push(`avatar = $${paramCount}`);
            params.push(avatar);
        }
        if (bio !== undefined) {
            paramCount++;
            updates.push(`bio = $${paramCount}`);
            params.push(bio);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);
        paramCount++;

        const query = `
            UPDATE users 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount} 
            RETURNING id, email, first_name, last_name, phone, avatar, bio, role
        `;

        const result = await db.query(query, params);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

/**
 * Get user's published flowers
 */
exports.getUserPublications = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            `SELECT f.*, c.name as category_name,
                    COUNT(DISTINCT fav.id) as favorite_count,
                    COUNT(DISTINCT o.id) as order_count
             FROM flowers f
             JOIN categories c ON f.category_id = c.id
             LEFT JOIN favorites fav ON f.id = fav.flower_id
             LEFT JOIN orders o ON f.id = o.flower_id
             WHERE f.user_id = $1
             GROUP BY f.id, c.name
             ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get publications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch publications',
            error: error.message
        });
    }
};

/**
 * Get user statistics
 */
exports.getUserStats = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get counts
        const publicationsCount = await db.query(
            'SELECT COUNT(*) as count FROM flowers WHERE user_id = $1',
            [userId]
        );
        const ordersCount = await db.query(
            'SELECT COUNT(*) as count FROM orders WHERE client_id = $1',
            [userId]
        );
        const favoritesCount = await db.query(
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            data: {
                publications: parseInt(publicationsCount.rows[0].count),
                orders: parseInt(ordersCount.rows[0].count),
                favorites: parseInt(favoritesCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: error.message
        });
    }
};
