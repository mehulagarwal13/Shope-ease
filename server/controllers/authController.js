const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, shopName: user.shopName },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { shopName, ownerName, email, password, phone, address, gstNumber } = req.body;

        // Validate required fields explicitly
        const missing = [];
        if (!shopName || !shopName.toString().trim()) missing.push('shopName');
        if (!ownerName || !ownerName.toString().trim()) missing.push('ownerName');
        if (!email || !email.toString().trim()) missing.push('email');
        if (!password || !password.toString().trim()) missing.push('password');

        if (missing.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Enter a valid email address' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            shopName: shopName.trim(),
            ownerName: ownerName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone ? phone.trim() : undefined,
            address: address ? address.trim() : undefined,
            gstNumber: gstNumber ? gstNumber.trim() : undefined
        });

        res.status(201).json({ message: 'Account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);

        // Handle MongoDB duplicate key error (E11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.status(409).json({
                message: `An account with this ${field} already exists.`
            });
        }

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                shopName: user.shopName,
                ownerName: user.ownerName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                gstNumber: user.gstNumber
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { signup, login, getMe };
