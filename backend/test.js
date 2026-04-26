const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
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
            role: 'admin',        // ✅ changed to admin
            isVerified: true,
            isActive: true
        });

        console.log('✅ User created successfully!');
        console.log(`   Name:     ${user.name}`);
        console.log(`   Phone:    9345578103`);
        console.log(`   Password: 1234`);
        console.log(`   ID:       ${user.customerId}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createUser();