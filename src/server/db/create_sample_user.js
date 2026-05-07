/**
 * Create sample user for testing
 * Run with: node db/create_sample_user.js
 */

const bcrypt = require('bcryptjs');
const db = require('../db');

async function createSampleUser() {
  try {
    console.log('Creating sample user...');
    
    // Sample credentials
    const phone = '09123456789';
    const password = 'Test1234!';
    const name = 'Test Farmer';
    const username = 'testfarmer';
    const email = 'test@example.com';
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Check if user already exists
    const existing = await db('users').where({ phone }).first();
    if (existing) {
      console.log('Sample user already exists');
      console.log(`Phone: ${phone}`);
      console.log(`Password: ${password}`);
      process.exit(0);
    }
    
    // Insert user
    const [user] = await db('users')
      .insert({
        name,
        phone,
        username,
        email,
        password_hash,
        subscription_tier: 'freemium',
      })
      .returning('*');
    
    console.log('✅ Sample user created successfully');
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`User ID: ${user.id}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating sample user:', err.message);
    process.exit(1);
  }
}

createSampleUser();
