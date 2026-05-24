const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const { initializeGoldRateScheduler } = require('./services/goldRateScheduler');
connectDB();

const app = express();

// Render sits behind a proxy/load balancer, so trust forwarded client IP headers.
app.set('trust proxy', 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS
]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    ...configuredOrigins
])];

app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        const message = `CORS blocked for origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`;
        return callback(new Error(message));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/schemes', require('./routes/schemeRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/gold-rate', require('./routes/goldRateRoutes'));
app.use('/api/rates', require('./routes/goldRateRoutes'));
app.use('/api/redemptions', require('./routes/redemptionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/newarrivals', require('./routes/newArrivalRoutes'));
app.use('/api/offers', require('./routes/offersRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/home', require('./routes/homeRoutes'));
app.use('/api/plan-catalog', require('./routes/planCatalogRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/agent', require('./routes/agentRoutes'));
app.use('/api/agents', require('./routes/Agentmanageroutes'));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'JewelScheme API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '💎 Welcome to JewelScheme API',
        version: '2.0.0',
        documentation: '/api/health'
    });
});

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    initializeGoldRateScheduler();
});

process.on('unhandledRejection', (err) => {
    server.close(() => process.exit(1));
});

module.exports = app;
