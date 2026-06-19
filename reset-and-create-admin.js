const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAndCreateAdmin() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/strayzilbase');
    console.log('Connected to MongoDB');
    
    // Delete all existing users
    const deleteResult = await mongoose.connection.db.collection('users').deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} users`);
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const adminUser = {
      username: 'StrayzilAdmin',
      email: 'iyobahmed3@gmail.com',
      password: hashedPassword,
      role: 'owner',
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
      joinedAt: new Date(),
      lastActive: new Date(),
      stats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        modsSubmitted: 0,
        downloads: 0
      }
    };
    
    const result = await mongoose.connection.db.collection('users').insertOne(adminUser);
    console.log('\n=== ADMIN USER CREATED ===');
    console.log('Username: StrayzilAdmin');
    console.log('Email: iyobahmed3@gmail.com');
    console.log('Password: Admin123!');
    console.log('Role: owner');
    console.log('ID:', result.insertedId);
    console.log('\nYou can now log in with these credentials!');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetAndCreateAdmin();