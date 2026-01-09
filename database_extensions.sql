-- ========================================
-- E-COMMERCE EXTENSIONS: Cart, Reviews, Multi-item Orders
-- Run this after the main neon_setup_fixed.sql
-- ========================================

-- ========================================
-- 1. SHOPPING CART SYSTEM
-- ========================================

CREATE TABLE IF NOT EXISTS shopping_carts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON shopping_carts(user_id);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, flower_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_flower ON cart_items(flower_id);

-- ========================================
-- 2. REVIEWS & RATINGS SYSTEM
-- ========================================

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, flower_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_flower ON reviews(flower_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ========================================
-- 3. MULTI-ITEM ORDERS SUPPORT
-- ========================================

-- Drop the old single-item order constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_flower_id_fkey;
ALTER TABLE orders ALTER COLUMN flower_id DROP NOT NULL;

-- Create order items table for multi-item support
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    flower_id INT NOT NULL REFERENCES flowers(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_flower ON order_items(flower_id);

-- ========================================
-- 4. HELPFUL VIEWS
-- ========================================

-- Cart summary view
CREATE OR REPLACE VIEW cart_summary AS
SELECT 
    c.id as cart_id,
    c.user_id,
    COUNT(ci.id) as item_count,
    SUM(ci.quantity) as total_quantity,
    SUM(ci.quantity * f.price) as total_amount
FROM shopping_carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN flowers f ON ci.flower_id = f.id
GROUP BY c.id, c.user_id;

-- Flower ratings view
CREATE OR REPLACE VIEW flower_ratings AS
SELECT 
    f.id as flower_id,
    f.name,
    COUNT(r.id) as review_count,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star
FROM flowers f
LEFT JOIN reviews r ON f.id = r.flower_id
GROUP BY f.id, f.name;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ E-commerce extensions created successfully!';
    RAISE NOTICE '   - Shopping cart tables created';
    RAISE NOTICE '   - Reviews system ready';
    RAISE NOTICE '   - Multi-item orders supported';
END $$;
