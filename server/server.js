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

// Serve Static Files in Production (no wildcard routes needed)
const fs = require('fs');
const clientBuildPath = path.join(__dirname, 'public');
console.log('[Server] clientBuildPath:', clientBuildPath);
console.log('[Server] dist exists:', fs.existsSync(clientBuildPath));
console.log('[Server] index.html exists:', fs.existsSync(path.join(clientBuildPath, 'index.html')));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(clientBuildPath));
}

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Catch-all: serve index.html for frontend routes in production
app.use((req, res) => {
    if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
        const indexPath = path.join(clientBuildPath, 'index.html');
        console.log('[Catch-all] sending index.html for:', req.path, '| file exists:', fs.existsSync(indexPath));
        return res.sendFile(indexPath);
    }
    res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB & Start server
const PORT = process.env.PORT || 5000;
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
