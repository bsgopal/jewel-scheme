const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        mongoose.connection.on('error', (err) => {
            // MongoDB connection error
        });

        mongoose.connection.on('disconnected', () => {
            // MongoDB disconnected
        });

        mongoose.connection.on('reconnected', () => {
            // MongoDB reconnected
        });
    } catch (error) {
        // MongoDB Connection Error
        process.exit(1);
    }
};

module.exports = connectDB;
