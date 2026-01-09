const db = require('../config/database');

/**
 * Get user's shopping cart
 */
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get or create cart
        let cart = await db.query(
            'SELECT * FROM shopping_carts WHERE user_id = $1',
            [userId]
        );

        if (cart.rows.length === 0) {
            cart = await db.query(
                'INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING *',
                [userId]
            );
        }

        const cartId = cart.rows[0].id;

        // Get cart items with flower details
        const items = await db.query(`
            SELECT 
                ci.id,
                ci.quantity,
                ci.added_at,
                f.id as flower_id,
                f.name,
                f.price,
                f.image,
                f.stock,
                f.published,
                (ci.quantity * f.price) as subtotal
            FROM cart_items ci
            JOIN flowers f ON ci.flower_id = f.id
            WHERE ci.cart_id = $1
            ORDER BY ci.added_at DESC
        `, [cartId]);

        const total = items.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        res.json({
            success: true,
            data: {
                cart_id: cartId,
                items: items.rows,
                item_count: items.rows.length,
                total_quantity: items.rows.reduce((sum, item) => sum + item.quantity, 0),
                total: total.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to get cart' });
    }
};

/**
 * Add item to cart
 */
exports.addItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { flower_id, quantity = 1 } = req.body;

        // Validate flower exists and has stock
        const flower = await db.query(
            'SELECT * FROM flowers WHERE id = $1 AND published = true',
            [flower_id]
        );

        if (flower.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Flower not found' });
        }

        if (flower.rows[0].stock < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        // Get or create cart
        let cart = await db.query(
            'SELECT * FROM shopping_carts WHERE user_id = $1',
            [userId]
        );

        if (cart.rows.length === 0) {
            cart = await db.query(
                'INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING *',
                [userId]
            );
        }

        const cartId = cart.rows[0].id;

        // Check if item already in cart
        const existing = await db.query(
            'SELECT * FROM cart_items WHERE cart_id = $1 AND flower_id = $2',
            [cartId, flower_id]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update quantity
            const newQuantity = existing.rows[0].quantity + quantity;
            if (flower.rows[0].stock < newQuantity) {
                return res.status(400).json({ success: false, message: 'Insufficient stock' });
            }

            result = await db.query(
                'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
                [newQuantity, existing.rows[0].id]
            );
        } else {
            // Add new item
            result = await db.query(
                'INSERT INTO cart_items (cart_id, flower_id, quantity) VALUES ($1, $2, $3) RETURNING *',
                [cartId, flower_id, quantity]
            );
        }

        res.json({
            success: true,
            message: 'Item added to cart',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to add item to cart' });
    }
};

/**
 * Update cart item quantity
 */
exports.updateItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Verify item belongs to user's cart
        const item = await db.query(`
            SELECT ci.*, f.stock
            FROM cart_items ci
            JOIN shopping_carts c ON ci.cart_id = c.id
            JOIN flowers f ON ci.flower_id = f.id
            WHERE ci.id = $1 AND c.user_id = $2
        `, [itemId, userId]);

        if (item.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        if (item.rows[0].stock < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        const result = await db.query(
            'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
            [quantity, itemId]
        );

        res.json({
            success: true,
            message: 'Cart updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to update cart' });
    }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id;

        // Verify item belongs to user's cart
        const item = await db.query(`
            SELECT ci.*
            FROM cart_items ci
            JOIN shopping_carts c ON ci.cart_id = c.id
            WHERE ci.id = $1 AND c.user_id = $2
        `, [itemId, userId]);

        if (item.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        await db.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove item' });
    }
};

/**
 * Clear entire cart
 */
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.query(`
            DELETE FROM cart_items
            WHERE cart_id IN (SELECT id FROM shopping_carts WHERE user_id = $1)
        `, [userId]);

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
};

/**
 * Checkout - Create order from cart
 */
exports.checkout = async (req, res) => {
    const client = await db.query('BEGIN');

    try {
        const userId = req.user.id;
        const { delivery_address, notes } = req.body;

        if (!delivery_address) {
            return res.status(400).json({ success: false, message: 'Delivery address is required' });
        }

        // Get cart items
        const cart = await db.query('SELECT id FROM shopping_carts WHERE user_id = $1', [userId]);
        if (cart.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const cartId = cart.rows[0].id;
        const items = await db.query(`
            SELECT ci.*, f.price, f.stock, f.name
            FROM cart_items ci
            JOIN flowers f ON ci.flower_id = f.id
            WHERE ci.cart_id = $1 AND f.published = true
        `, [cartId]);

        if (items.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Validate stock
        for (const item of items.rows) {
            if (item.stock < item.quantity) {
                await db.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.name}`
                });
            }
        }

        // Calculate total
        const total = items.rows.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0);

        // Create order
        const orderNumber = `ORD-${Date.now()}-${userId}`;
        const order = await db.query(`
            INSERT INTO orders (order_number, client_id, delivery_address, notes, total_price, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `, [orderNumber, userId, delivery_address, notes, total]);

        const orderId = order.rows[0].id;

        // Create order items
        for (const item of items.rows) {
            const subtotal = item.quantity * parseFloat(item.price);
            await db.query(`
                INSERT INTO order_items (order_id, flower_id, quantity, unit_price, subtotal)
                VALUES ($1, $2, $3, $4, $5)
            `, [orderId, item.flower_id, item.quantity, item.price, subtotal]);
        }

        // Create initial order status
        await db.query(`
            INSERT INTO order_status_history (order_id, status, changed_by)
            VALUES ($1, 'pending', $2)
        `, [orderId, userId]);

        // Create notification
        await db.query(`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES ($1, 'order', 'Order Placed', $2, $3)
        `, [userId, `Your order ${orderNumber} has been placed successfully!`, `/orders/${orderId}`]);

        // Clear cart
        await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

        await db.query('COMMIT');

        res.json({
            success: true,
            message: 'Order placed successfully',
            data: {
                order_id: orderId,
                order_number: orderNumber,
                total: total.toFixed(2),
                items_count: items.rows.length
            }
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: 'Failed to process checkout' });
    }
};

module.exports = exports;
