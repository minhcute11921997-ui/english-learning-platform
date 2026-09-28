const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/app');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Chấp nhận reverse proxy (Nginx, Cloudflare) để nhận diện IP thực
app.set('trust proxy', 1);

// Tối ưu nén dữ liệu HTTP response (Gzip/Brotli) giúp giảm 70-80% băng thông tải
app.use(compression());

// === Security Middleware ===
app.use(helmet());
app.disable('x-powered-by');

const allowedOrigins = [
  config.clientUrl,
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5173',
  'http://localhost:8080'
].filter(Boolean);

app.use(cors({
  origin: config.env === 'production'
    ? (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin))
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting tổng quát cho API
app.use('/api', apiLimiter);

// === Body parsing (giới hạn 1mb để ngăn chặn tấn công làm cạn kiệt RAM qua payload lớn) ===
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
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
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.env}`);
    console.log(`💾 Database: ${process.env.DB_NAME || 'english_learning'}`);
    console.log(`🔗 Client URL: ${config.clientUrl}\n`);
  });

  // Phòng chống tấn công Slowloris: timeout giữ kết nối và đọc headers
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Bắt các Promise Rejection chưa xử lý (Unhandled Rejection)
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Lỗi chưa xử lý:', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Bắt các ngoại lệ bất ngờ (Uncaught Exception)
  process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Ngoại lệ chưa bắt:', err);
    process.exit(1);
  });

  // Graceful Shutdown khi dừng dịch vụ (SIGTERM, SIGINT)
  const { sequelize } = require('./models');
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang đóng các kết nối an toàn...`);
    server.close(async () => {
      try {
        await sequelize.close();
        console.log('✅ Đã đóng kết nối Database. Hoàn tất tắt server.');
        process.exit(0);
      } catch (dbErr) {
        console.error('❌ Lỗi khi đóng database:', dbErr);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('⚠️ Đóng server quá thời gian chờ, ép buộc dừng.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
