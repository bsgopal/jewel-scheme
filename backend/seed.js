const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/User');
const GoldRate = require('./models/GoldRate');
const Branch = require('./models/Branch');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await GoldRate.deleteMany({});
        await Branch.deleteMany({});

        // Create Admin User
        console.log('👤 Creating admin user...');
        const adminPassword = await bcrypt.hash('admin123', 12);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@jewelscheme.com',
            phone: '9999999999',
            password: adminPassword,
            role: 'admin',
            isVerified: true,
            isActive: true,
            address: {
                street: '123 Admin Street',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001'
            }
        });
        console.log(`   ✅ Admin created: ${admin.customerId}`);

        // Create Staff User
        console.log('👤 Creating staff user...');
        const staffPassword = await bcrypt.hash('staff123', 12);
        const staff = await User.create({
            name: 'Staff User',
            email: 'staff@jewelscheme.com',
            phone: '8888888888',
            password: staffPassword,
            role: 'staff',
            isVerified: true,
            isActive: true
        });
        console.log(`   ✅ Staff created: ${staff.customerId}`);

        // Create Test Customer
        console.log('👤 Creating test customer...');
        const customerPassword = await bcrypt.hash('customer123', 12);
        const customer = await User.create({
            name: 'Test Customer',
            email: 'customer@test.com',
            phone: '7777777777',
            password: customerPassword,
            role: 'customer',
            isVerified: true,
            isActive: true,
            address: {
                street: '456 Customer Lane',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600002'
            }
        });
        console.log(`   ✅ Customer created: ${customer.customerId}`);

        // Create Gold Rates for last 30 days
        console.log('💰 Creating gold rate history...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 30; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Random variation in gold rate
            const baseRate22K = 6500 + Math.floor(Math.random() * 500) - 250;
            const baseRate24K = 7100 + Math.floor(Math.random() * 500) - 250;

            await GoldRate.create({
                date,
                gold22K: baseRate22K,
                gold24K: baseRate24K,
                gold18K: Math.floor(baseRate22K * 0.82),
                silver: 85 + Math.floor(Math.random() * 10) - 5,
                platinum: 3200 + Math.floor(Math.random() * 200),
                updatedBy: admin._id
            });
        }
        console.log('   ✅ Gold rates created for last 30 days');

        // Create Branches
        console.log('🏪 Creating branches...');
        const branches = [
            {
                branchName: 'JewelScheme - T. Nagar',
                address: {
                    street: '12, Usman Road',
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    pincode: '600017',
                    landmark: 'Near Pondy Bazaar'
                },
                phone: '044-24340001',
                email: 'tnagar@jewelscheme.com',
                manager: {
                    name: 'Rajesh Kumar',
                    phone: '9876543210',
                    email: 'rajesh@jewelscheme.com'
                },
                workingHours: {
                    weekdays: { open: '10:00 AM', close: '09:00 PM' },
                    saturday: { open: '10:00 AM', close: '09:00 PM' },
                    sunday: { open: '11:00 AM', close: '06:00 PM' }
                },
                facilities: ['Parking', 'AC', 'Locker', 'Repair', 'Customization']
            },
            {
                branchName: 'JewelScheme - Anna Nagar',
                address: {
                    street: '45, 2nd Avenue',
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    pincode: '600040',
                    landmark: 'Near Anna Nagar Tower'
                },
                phone: '044-26210002',
                email: 'annanagar@jewelscheme.com',
                manager: {
                    name: 'Priya Sharma',
                    phone: '9876543211',
                    email: 'priya@jewelscheme.com'
                },
                workingHours: {
                    weekdays: { open: '10:00 AM', close: '09:00 PM' },
                    saturday: { open: '10:00 AM', close: '09:00 PM' },
                    sunday: { open: '11:00 AM', close: '06:00 PM' }
                },
                facilities: ['Parking', 'AC', 'Repair', 'Exchange']
            },
            {
                branchName: 'JewelScheme - Coimbatore',
                address: {
                    street: '78, RS Puram',
                    city: 'Coimbatore',
                    state: 'Tamil Nadu',
                    pincode: '641002',
                    landmark: 'Near Brookefields Mall'
                },
                phone: '0422-2540003',
                email: 'coimbatore@jewelscheme.com',
                manager: {
                    name: 'Suresh Babu',
                    phone: '9876543212',
                    email: 'suresh@jewelscheme.com'
                },
                workingHours: {
                    weekdays: { open: '10:00 AM', close: '08:30 PM' },
                    saturday: { open: '10:00 AM', close: '08:30 PM' },
                    sunday: { open: '10:30 AM', close: '05:00 PM' }
                },
                facilities: ['Parking', 'AC', 'Locker', 'Customization']
            }
        ];

        for (const branchData of branches) {
            await Branch.create(branchData);
        }
        console.log('   ✅ Branches created');

        console.log('\n========================================');
        console.log('✅ Database seeded successfully!');
        console.log('========================================\n');
        console.log('📋 Test Accounts:');
        console.log('------------------');
        console.log('Admin:    9999999999 / admin123');
        console.log('Staff:    8888888888 / staff123');
        console.log('Customer: 7777777777 / customer123');
        console.log('\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seedData();