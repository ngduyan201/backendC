import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import crosswordRoutes from './routes/crosswordRoutes.js';

const app = express();

// Basic middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Safe logging middleware - không log sensitive data
app.use((req, res, next) => {
  const safeReq = {
    method: req.method,
    url: req.url,
    headers: {
      origin: req.headers.origin,
      'content-type': req.headers['content-type']
    }
  };
  
  if (req.body) {
    safeReq.body = { ...req.body };
    if (safeReq.body.password) {
      safeReq.body.password = '[HIDDEN]';
    }
  }
  
  console.log('Request:', safeReq);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/crosswords', crosswordRoutes);

// Error handler
app.use((err, req, res, next) => {
  // Log error an toàn
  console.error('Error:', {
    status: err.status || 500,
    message: err.message,
    path: req.path
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: 'Đã xảy ra lỗi server'
  });
});

const PORT = process.env.PORT || 5001;

// Khởi động server
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
