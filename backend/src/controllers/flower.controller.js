const db = require('../config/database');

/**
 * Get all flowers with filters and pagination
 */
exports.getAllFlowers = async (req, res) => {
    try {
        const {
            category,
            season,
            minPrice,
            maxPrice,
            search,
            page = 1,
            limit = 12,
            sort = 'created_at',
            order = 'DESC'
        } = req.query;

        let query = `
            SELECT f.id, f.name, f.scientific_name, f.description, f.price, f.image, 
                   f.category_id, f.user_id, f.published, f.stock, f.care_instructions, 
                   f.meaning, f.views, f.created_at, f.updated_at,
                   c.name as category_name,
                   u.first_name || ' ' || COALESCE(u.last_name, '') as seller_name,
                   COUNT(DISTINCT fav.id) as favorite_count
            FROM flowers f
            JOIN categories c ON f.category_id = c.id
            JOIN users u ON f.user_id = u.id
            LEFT JOIN favorites fav ON f.id = fav.flower_id
            LEFT JOIN flower_seasons fs ON f.id = fs.flower_id
            WHERE f.published = true
        `;

        const params = [];
        let paramCount = 0;

        // Apply filters
        if (category) {
            paramCount++;
            query += ` AND f.category_id = $${paramCount}`;
            params.push(category);
        }

        if (season) {
            paramCount++;
            query += ` AND fs.season_id = $${paramCount}`;
            params.push(season);
        }

        if (minPrice) {
            paramCount++;
            query += ` AND f.price >= $${paramCount}`;
            params.push(minPrice);
        }

        if (maxPrice) {
            paramCount++;
            query += ` AND f.price <= $${paramCount}`;
            params.push(maxPrice);
        }

        if (search) {
            paramCount++;
            query += ` AND (f.name ILIKE $${paramCount} OR f.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ` GROUP BY f.id, c.name, u.first_name, u.last_name`;

        // Sorting
        const validSortFields = ['created_at', 'price', 'name', 'views'];
        const sortField = validSortFields.includes(sort) ? sort : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY f.${sortField} ${sortOrder}`;

        // Pagination
        const offset = (page - 1) * limit;
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await db.query(query, params);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT f.id) as total
            FROM flowers f
            LEFT JOIN flower_seasons fs ON f.id = fs.flower_id
            WHERE f.published = true
        `;
        const countParams = [];
        let countParamIndex = 0;

        if (category) {
            countParamIndex++;
            countQuery += ` AND f.category_id = $${countParamIndex}`;
            countParams.push(category);
        }
        if (season) {
            countParamIndex++;
            countQuery += ` AND fs.season_id = $${countParamIndex}`;
            countParams.push(season);
        }
        if (minPrice) {
            countParamIndex++;
            countQuery += ` AND f.price >= $${countParamIndex}`;
            countParams.push(minPrice);
        }
        if (maxPrice) {
            countParamIndex++;
            countQuery += ` AND f.price <= $${countParamIndex}`;
            countParams.push(maxPrice);
        }
        if (search) {
            countParamIndex++;
            countQuery += ` AND (f.name ILIKE $${countParamIndex} OR f.description ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get flowers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flowers',
            error: error.message
        });
    }
};

/**
 * Get single flower by ID with details
 */
exports.getFlowerById = async (req, res) => {
    const { id } = req.params;

    try {
        // Get flower with details
        const flowerResult = await db.query(
            `SELECT f.*, 
                    c.name as category_name,
                    u.first_name || ' ' || COALESCE(u.last_name, '') as seller_name,
                    u.id as seller_id,
                    u.email as seller_email,
                    COUNT(DISTINCT fav.id) as favorite_count
             FROM flowers f
             JOIN categories c ON f.category_id = c.id
             JOIN users u ON f.user_id = u.id
             LEFT JOIN favorites fav ON f.id = fav.flower_id
             WHERE f.id = $1
             GROUP BY f.id, c.name, u.first_name, u.last_name, u.id, u.email`,
            [id]
        );

        if (flowerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flower not found'
            });
        }

        const flower = flowerResult.rows[0];

        // Get colors
        const colorsResult = await db.query(
            'SELECT color FROM flower_colors WHERE flower_id = $1',
            [id]
        );
        flower.colors = colorsResult.rows.map(row => row.color);

        // Get seasons
        const seasonsResult = await db.query(
            `SELECT s.id, s.name, s.display_name 
             FROM seasons s
             JOIN flower_seasons fs ON s.id = fs.season_id
             WHERE fs.flower_id = $1`,
            [id]
        );
        flower.seasons = seasonsResult.rows;

        // Get additional images
        const imagesResult = await db.query(
            'SELECT image_url FROM flower_images WHERE flower_id = $1 ORDER BY display_order',
            [id]
        );
        flower.additional_images = imagesResult.rows.map(row => row.image_url);

        // Increment view count
        await db.query(
            'UPDATE flowers SET views = views + 1 WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            data: flower
        });
    } catch (error) {
        console.error('Get flower by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flower',
            error: error.message
        });
    }
};

/**
 * Create new flower (authenticated users only)
 */
exports.createFlower = async (req, res) => {
    const {
        name,
        scientific_name,
        description,
        price,
        image,
        category_id,
        published = false,
        stock = 0,
        care_instructions,
        meaning,
        colors = [],
        seasons = []
    } = req.body;

    const userId = req.user.id;

    try {
        // Start transaction
        await db.query('BEGIN');

        // Insert flower
        const flowerResult = await db.query(
            `INSERT INTO flowers 
             (name, scientific_name, description, price, image, category_id, user_id, 
              published, stock, care_instructions, meaning)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [name, scientific_name, description, price, image, category_id, userId,
                published, stock, care_instructions, meaning]
        );

        const flower = flowerResult.rows[0];

        // Insert colors if provided
        if (colors && colors.length > 0) {
            for (const color of colors) {
                await db.query(
                    'INSERT INTO flower_colors (flower_id, color) VALUES ($1, $2)',
                    [flower.id, color]
                );
            }
        }

        // Insert seasons if provided
        if (seasons && seasons.length > 0) {
            for (const seasonId of seasons) {
                await db.query(
                    'INSERT INTO flower_seasons (flower_id, season_id) VALUES ($1, $2)',
                    [flower.id, seasonId]
                );
            }
        }

        await db.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Flower created successfully',
            data: flower
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Create flower error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create flower',
            error: error.message
        });
    }
};

/**
 * Update flower (owner only)
 */
exports.updateFlower = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    try {
        // Check ownership
        const ownerCheck = await db.query(
            'SELECT user_id FROM flowers WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flower not found'
            });
        }

        if (ownerCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this flower'
            });
        }

        // Build update query dynamically
        const allowedFields = ['name', 'scientific_name', 'description', 'price', 'image',
            'category_id', 'published', 'stock', 'care_instructions', 'meaning'];
        const updateFields = [];
        const params = [];
        let paramCount = 0;

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                paramCount++;
                updateFields.push(`${field} = $${paramCount}`);
                params.push(updates[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        paramCount++;

        const query = `UPDATE flowers SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await db.query(query, params);

        res.json({
            success: true,
            message: 'Flower updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update flower error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flower',
            error: error.message
        });
    }
};

/**
 * Delete flower (owner only)
 */
exports.deleteFlower = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Check ownership
        const ownerCheck = await db.query(
            'SELECT user_id FROM flowers WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flower not found'
            });
        }

        if (ownerCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this flower'
            });
        }

        // Delete flower (cascade will handle related records)
        await db.query('DELETE FROM flowers WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Flower deleted successfully'
        });
    } catch (error) {
        console.error('Delete flower error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete flower',
            error: error.message
        });
    }
};

/**
 * Get flowers by specific user
 */
exports.getFlowersByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await db.query(
            `SELECT f.*, c.name as category_name,
                    COUNT(DISTINCT fav.id) as favorite_count
             FROM flowers f
             JOIN categories c ON f.category_id = c.id
             LEFT JOIN favorites fav ON f.id = fav.flower_id
             WHERE f.user_id = $1 AND f.published = true
             GROUP BY f.id, c.name
             ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get flowers by user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user flowers',
            error: error.message
        });
    }
};
