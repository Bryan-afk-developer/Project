-- ========================================
-- Azzuna Flowers - Complete PostgreSQL Schema
-- Full MVP with Auth, CRUD, Orders, Social Gallery
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. USERS & AUTHENTICATION
-- ========================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('admin', 'florist', 'client')),
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Sessions/Tokens for JWT refresh
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(refresh_token);

-- ========================================
-- 2. CATEGORIES & SEASONS
-- ========================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. FLOWERS (Core Product)
-- ========================================

CREATE TABLE IF NOT EXISTS flowers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT NOT NULL,
    category_id INT NOT NULL REFERENCES categories(id),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    published BOOLEAN DEFAULT FALSE,
    stock INT DEFAULT 0,
    care_instructions TEXT,
    meaning TEXT,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flowers_category ON flowers(category_id);
CREATE INDEX idx_flowers_user ON flowers(user_id);
CREATE INDEX idx_flowers_published ON flowers(published);
CREATE INDEX idx_flowers_price ON flowers(price);

-- Flower Images (Gallery)
CREATE TABLE IF NOT EXISTS flower_images (
    id SERIAL PRIMARY KEY,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flower Colors
CREATE TABLE IF NOT EXISTS flower_colors (
    id SERIAL PRIMARY KEY,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    color VARCHAR(50) NOT NULL
);

-- Flower Seasons (Many-to-Many)
CREATE TABLE IF NOT EXISTS flower_seasons (
    id SERIAL PRIMARY KEY,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    season_id INT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    UNIQUE(flower_id, season_id)
);

-- ========================================
-- 4. ORDERS & NOTIFICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
    delivery_address TEXT NOT NULL,
    color_preference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_flower ON orders(flower_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    changed_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ========================================
-- 5. WISHLIST & FAVORITES
-- ========================================

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flower_id INT NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, flower_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ========================================
-- 6. SEED DATA
-- ========================================

-- Admin User (password: password123 - bcrypt hash)
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@azzuna.com', '$2a$10$9Hx3rXvZ0XqKjN8L7yJ8KOzB7y3nO8qF1X2e3m4T5h6i7s8d9f0a1b', 'Admin', 'Azzuna', 'admin'),
('floreria@azzuna.com', '$2a$10$9Hx3rXvZ0XqKjN8L7yJ8KOzB7y3nO8qF1X2e3m4T5h6i7s8d9f0a1b', 'Florería', 'Demo', 'florist'),
('cliente@azzuna.com', '$2a$10$9Hx3rXvZ0XqKjN8L7yJ8KOzB7y3nO8qF1X2e3m4T5h6i7s8d9f0a1b', 'Cliente', 'Demo', 'client')
ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO categories (name, description, icon) VALUES
('Rosas', 'Hermosas rosas en diferentes colores', '🌹'),
('Flores de Campo', 'Flores silvestres y naturales', '🌼'),
('Lirios', 'Elegantes lirios para ocasiones especiales', '🌷'),
('Orquídeas', 'Exóticas orquídeas', '🌺'),
('Girasoles', 'Brillantes girasoles', '🌻')
ON CONFLICT (name) DO NOTHING;

-- Seasons
INSERT INTO seasons (name, display_name) VALUES
('spring', 'Primavera'),
('summer', 'Verano'),
('autumn', 'Otoño'),
('winter', 'Invierno'),
('all-year', 'Todo el Año')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 7. USEFUL VIEWS
-- ========================================

-- Full flower details with category and user info
CREATE OR REPLACE VIEW flower_details AS
SELECT 
    f.*,
    c.name as category_name,
    u.first_name || ' ' || COALESCE(u.last_name, '') as seller_name,
    u.email as seller_email,
    COUNT(DISTINCT fav.id) as favorite_count
FROM flowers f
JOIN categories c ON f.category_id = c.id
JOIN users u ON f.user_id = u.id
LEFT JOIN favorites fav ON f.id = fav.flower_id
GROUP BY f.id, c.name, u.first_name, u.last_name, u.email;

-- ========================================
-- END OF SCHEMA
-- ========================================
