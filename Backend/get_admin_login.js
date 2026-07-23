const mongoose = require('mongoose');
require('dotenv').config();
const Login = require('./Model/login');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Login.find({ role: 'admin' });
    admins.forEach(admin => {
      console.log({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        tokensCount: admin.tokens ? admin.tokens.length : 0
      });
    });
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

test();
