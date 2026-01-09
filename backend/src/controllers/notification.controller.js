const db = require('../config/database');

/**
 * Get all notifications for authenticated user
 */
exports.getUserNotifications = async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await db.query(
            `UPDATE notifications SET read = true 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            `SELECT COUNT(*) as unread_count 
             FROM notifications 
             WHERE user_id = $1 AND read = false`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                unread_count: parseInt(result.rows[0].unread_count)
            }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.id;

    try {
        await db.query(
            `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all as read',
            error: error.message
        });
    }
};
