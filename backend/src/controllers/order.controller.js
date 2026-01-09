const db = require('../config/database');

/**
 * Create new order
 */
exports.createOrder = async (req, res) => {
    const {
        flower_id,
        quantity,
        delivery_address,
        color_preference,
        notes
    } = req.body;

    const clientId = req.user.id;

    try {
        // Start transaction
        await db.query('BEGIN');

        // Get flower details
        const flowerResult = await db.query(
            'SELECT id, name, price, stock FROM flowers WHERE id = $1',
            [flower_id]
        );

        if (flowerResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Flower not found'
            });
        }

        const flower = flowerResult.rows[0];
        const unitPrice = parseFloat(flower.price);
        const totalPrice = unitPrice * quantity;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${clientId}`;

        // Create order
        const orderResult = await db.query(
            `INSERT INTO orders 
             (order_number, client_id, flower_id, quantity, unit_price, total_price, 
              delivery_address, color_preference, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
             RETURNING *`,
            [orderNumber, clientId, flower_id, quantity, unitPrice, totalPrice,
                delivery_address, color_preference, notes]
        );

        const order = orderResult.rows[0];

        // Add initial status to history
        await db.query(
            `INSERT INTO order_status_history (order_id, status, notes, changed_by)
             VALUES ($1, 'pending', 'Order created', $2)`,
            [order.id, clientId]
        );

        // Create notification for user
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, 'order_created', 'Order Created', 
                     'Your order #' || $2 || ' has been created successfully', 
                     '/orders/' || $3)`,
            [clientId, orderNumber, order.id]
        );

        await db.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

/**
 * Get all orders for authenticated user
 */
exports.getUserOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            `SELECT o.*, 
                    f.name as flower_name,
                    f.image as flower_image,
                    u.first_name || ' ' || COALESCE(u.last_name, '') as seller_name
             FROM orders o
             JOIN flowers f ON o.flower_id = f.id
             JOIN users u ON f.user_id = u.id
             WHERE o.client_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

/**
 * Get single order by ID with history
 */
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Get order with details
        const orderResult = await db.query(
            `SELECT o.*, 
                    f.name as flower_name,
                    f.image as flower_image,
                    f.description as flower_description,
                    u.first_name || ' ' || COALESCE(u.last_name, '') as seller_name,
                    u.email as seller_email
             FROM orders o
             JOIN flowers f ON o.flower_id = f.id
             JOIN users u ON f.user_id = u.id
             WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Check if user has access to this order
        if (order.client_id !== userId && req.user.role !== 'admin' && req.user.role !== 'florist') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get status history
        const historyResult = await db.query(
            `SELECT h.*, 
                    u.first_name || ' ' || COALESCE(u.last_name, '') as changed_by_name
             FROM order_status_history h
             LEFT JOIN users u ON h.changed_by = u.id
             WHERE h.order_id = $1
             ORDER BY h.created_at DESC`,
            [id]
        );

        order.status_history = historyResult.rows;

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    }
};

/**
 * Update order status (florist/admin only)
 */
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    // Only florist and admin can update order status
    if (req.user.role !== 'florist' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only florists and admins can update order status'
        });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    try {
        await db.query('BEGIN');

        // Update order status
        const orderResult = await db.query(
            `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (orderResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Add to status history
        await db.query(
            `INSERT INTO order_status_history (order_id, status, notes, changed_by)
             VALUES ($1, $2, $3, $4)`,
            [id, status, notes || '', userId]
        );

        // Create notification for client
        const statusMessages = {
            pending: 'Your order is pending',
            confirmed: 'Your order has been confirmed!',
            preparing: 'Your order is being prepared',
            completed: 'Your order is completed and ready!',
            cancelled: 'Your order has been cancelled'
        };

        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, 'order_status', 'Order Status Updated', $2, $3)`,
            [order.client_id, statusMessages[status], `/orders/${id}`]
        );

        await db.query('COMMIT');

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};
