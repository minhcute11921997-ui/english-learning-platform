const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/app');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// === Security Middleware ===
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - giới hạn 100 requests / 15 phút
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Quá nhiều request. Vui lòng thử lại sau 15 phút.'
  }
});
app.use('/api', limiter);

// === Body parsing ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// === Logging ===
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// === Static files ===
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// === Health check ===
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// === API Routes ===
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// === 404 handler ===
app.use((req, res, next) => {
  next(new AppError(`Không tìm thấy ${req.originalUrl} trên server`, 404));
});

// === Global error handler ===
app.use(errorHandler);

// === Start server ===
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.env}`);
  console.log(`💾 Database: ${process.env.DB_NAME || 'english_learning'}`);
  console.log(`🔗 Client URL: ${config.clientUrl}\n`);
});

module.exports = app;
