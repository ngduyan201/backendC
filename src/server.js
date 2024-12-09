import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

// Xử lý lỗi không bắt được
process.on('uncaughtException', (error) => {
  console.error('Lỗi không bắt được:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Promise bị reject:', error);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Thêm logging middleware để debug route
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy đường dẫn' });
});

// Thêm error handler chi tiết hơn
app.use((err, req, res, next) => {
  console.error('Error:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({ 
    message: 'Đã xảy ra lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại port ${PORT}`);
    });
  } catch (error) {
    console.error('Lỗi khởi động server:', error);
    process.exit(1);
  }
};

startServer();
