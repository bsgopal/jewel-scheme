const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
};

const createUser = async () => {
    try {
        await connectDB();

        // Delete if already exists
        await User.deleteOne({ $or: [{ phone: '9345578103' }, { email: 'bsgopal0@gmail.com' }] });

        const user = await User.create({
            name: 'GK',
            email: 'bsgopal0@gmail.com',
            phone: '9345578103',
            password: '123456',
            role: 'admin',
            isVerified: true,
            isActive: true
        });

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

createUser();