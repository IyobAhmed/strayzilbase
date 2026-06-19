const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/strayzilbase')
  .then(async () => {
    console.log('Connected to MongoDB');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('\n=== ALL USERS IN DATABASE ===');
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Verified: ${user.isVerified}`);
      console.log('');
    });
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });