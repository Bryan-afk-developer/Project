const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Register new user
 */
exports.register = async (req, res) => {
    const { email, password, first_name, last_name, phone, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await db.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, role) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, email, first_name, last_name, role, created_at`,
            [email, hashedPassword, first_name, last_name || null, phone || null, role || 'client']
        );

        const user = result.rows[0];

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await db.query(
            'INSERT INTO user_sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                },
                access_token: accessToken,
                refresh_token: refreshToken
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1 AND active = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await db.query(
            'INSERT INTO user_sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    avatar: user.avatar
                },
                access_token: accessToken,
                refresh_token: refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token required'
        });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

        // Check if refresh token exists in database
        const sessionResult = await db.query(
            'SELECT * FROM user_sessions WHERE refresh_token = $1 AND expires_at > NOW()',
            [refresh_token]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Get user data
        const userResult = await db.query(
            'SELECT id, email, role FROM users WHERE id = $1 AND active = true',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Generate new access token
        const accessToken = generateAccessToken(user);

        res.json({
            success: true,
            data: {
                access_token: accessToken
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(403).json({
            success: false,
            message: 'Invalid refresh token',
            error: error.message
        });
    }
};

/**
 * Logout user (invalidate refresh token)
 */
exports.logout = async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token required'
        });
    }

    try {
        // Delete refresh token from database
        await db.query(
            'DELETE FROM user_sessions WHERE refresh_token = $1',
            [refresh_token]
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

/**
 * Get current authenticated user
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, email, first_name, last_name, phone, avatar, bio, role, created_at 
             FROM users WHERE id = $1`,
            [req.user.id]
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
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data',
            error: error.message
        });
    }
};
