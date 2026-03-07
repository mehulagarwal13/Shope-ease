require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const billRoutes = require('./routes/bills');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(ao => origin.startsWith(ao))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);

// Serve Static Files in Production
if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientPath));

    app.get('/:splat*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientPath, 'index.html'));
        } else {
            res.status(404).json({ message: 'API route not found' });
        }
    });
} else {
    // Health check (only for dev, production handles it via static index or '*' catch-all)
    app.get('/api/health', (req, res) => res.json({ status: 'ShopEase API is running ✅' }));
}

// 404 handler for API routes
app.use('/api/:splat*', (req, res) => res.status(404).json({ message: 'API route not found' }));

// 404 handler (general)
app.use((req, res) => {
    if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Connect to MongoDB & Start server
const PORT = process.env.PORT || 5000;
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
