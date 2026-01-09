-- ========================================
-- Azzuna Flowers - Database Setup (Neon Compatible)
-- Skip extension creation - already exists in Neon
-- ========================================

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Sessions/Tokens for JWT refresh
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token);

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

CREATE INDEX IF NOT EXISTS idx_flowers_category ON flowers(category_id);
CREATE INDEX IF NOT EXISTS idx_flowers_user ON flowers(user_id);
CREATE INDEX IF NOT EXISTS idx_flowers_published ON flowers(published);
CREATE INDEX IF NOT EXISTS idx_flowers_price ON flowers(price);

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

CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_flower ON orders(flower_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

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

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ========================================
-- 6. SEED DATA
-- ========================================

-- Test Users (password for all: password123)
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

-- Sample Flowers (from florist account)
INSERT INTO flowers (name, scientific_name, description, price, image, category_id, user_id, published, stock, care_instructions, meaning) VALUES
('Rosa Roja Premium', 'Rosa gallica', 'Hermosa rosa roja, símbolo del amor verdadero. Ideal para ocasiones especiales y expresar sentimientos profundos.', 24.99, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', 1, 2, true, 100, 'Mantener en agua fresca, cortar tallos diagonalmente cada 2 días.', 'Amor y pasión'),
('Rosa Blanca Elegante', 'Rosa alba', 'Rosa blanca pura, perfecta para bodas y eventos formales. Símbolo de pureza e inocencia.', 22.99, 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400', 1, 2, true, 80, 'Cambiar agua diariamente, mantener alejada de luz solar directa.', 'Pureza y elegancia'),
('Rosa Rosada Delicada', 'Rosa chinensis', 'Rosa rosada suave, expresa gratitud y admiración. Perfecta para regalos amistosos.', 19.99, 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400', 1, 2, true, 120, 'Temperatura ambiente, evitar corrientes de aire.', 'Gratitud y admiración'),
('Girasol Brillante', 'Helianthus annuus', 'Girasol grande y alegre que sigue al sol. Trae energía positiva a cualquier espacio.', 15.99, 'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=400', 5, 2, true, 60, 'Mucha agua y luz solar directa. Cambiar agua cada 3 días.', 'Felicidad y energía'),
('Lirio Oriental Blanco', 'Lilium orientalis', 'Lirio blanco aromático, elegante y sofisticado. Ideal para centros de mesa.', 29.99, 'https://images.unsplash.com/photo-1569566850419-b5e4b8f0ff58?w=400', 3, 2, true, 45, 'Luz indirecta, agua moderada. Quitar anteras para evitar manchas.', 'Majestuosidad'),
('Orquídea Phalaenopsis', 'Phalaenopsis amabilis', 'Orquídea mariposa exótica de largo florecimiento. Muy apreciada y decorativa.', 45.00, 'https://images.unsplash.com/photo-1568118683546-1e93c801b8f7?w=400', 4, 2, true, 30, 'Riego semanal por inmersión, luz indirecta brillante.', 'Belleza refinada'),
('Margaritas Silvestres', 'Bellis perennis', 'Ramo de margaritas frescas de campo. Simplicidad y alegría natural.', 12.99, 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400', 2, 2, true, 150, 'Mucha agua, cambiar diariamente. Luz solar parcial.', 'Inocencia y alegría'),
('Tulipanes Mixtos', 'Tulipa gesneriana', 'Mezcla colorida de tulipanes frescos. Perfectos para primavera.', 18.99, 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400', 2, 2, true, 90, 'Agua fría, mantener tallos cortos. Evitar calor.', 'Amor perfecto'),
('Lavanda Aromática', 'Lavandula angustifolia', 'Ramilletes de lavanda fresca con aroma relajante. Ideal para decoración.', 14.99, 'https://images.unsplash.com/photo-1611251135414-b8e16b0c6878?w=400', 2, 2, true, 70, 'Poca agua, secar al aire para preservar.', 'Calma y serenidad'),
('Rosas Amarillas Alegres', 'Rosa foetida', 'Rosas amarillas vibrantes que transmiten amistad y alegría.', 21.99, 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400', 1, 2, true, 85, 'Agua fresca diaria, temperatura ambiente.', 'Amistad y alegría')
ON CONFLICT DO NOTHING;

-- Add colors to flowers
INSERT INTO flower_colors (flower_id, color) VALUES
(1, 'Rojo'),
(2, 'Blanco'),
(3, 'Rosado'),
(4, 'Amarillo'),
(5, 'Blanco'),
(6, 'Blanco/Rosa'),
(7, 'Blanco'),
(8, 'Mixto'),
(9, 'Púrpura'),
(10, 'Amarillo')
ON CONFLICT DO NOTHING;

-- Add seasons to flowers
INSERT INTO flower_seasons (flower_id, season_id) VALUES
(1, 5), (2, 5), (3, 5),
(4, 2),
(5, 1), (5, 2),
(6, 5),
(7, 1), (7, 2),
(8, 1),
(9, 2),
(10, 5)
ON CONFLICT (flower_id, season_id) DO NOTHING;

-- ========================================
-- 7. USEFUL VIEWS
-- ========================================

DROP VIEW IF EXISTS flower_details;
CREATE VIEW flower_details AS
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
