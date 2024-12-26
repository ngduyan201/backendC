import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    const { DB_HOST, DB_PORT, DB_NAME } = process.env;

    console.log('Đang kết nối đến MongoDB:', {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME
    });

    try {
        const mongoURI = process.env.MONGO_URI || `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Kết nối MongoDB thành công');
        
        // Thêm listener cho các sự kiện của mongoose
        mongoose.connection.on('error', err => {
            console.error('Lỗi MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB bị ngắt kết nối');
        });

    } catch (error) {
        console.error('Lỗi kết nối MongoDB:', {
            message: error.message,
            code: error.code,
            name: error.name
        });
        process.exit(1);
    }
};

export default connectDB;