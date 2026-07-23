const mongoose = require('mongoose');
require('dotenv').config();
const Login = require('./Model/login');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await Login.findOne({ email: 'abhi@gmail.com' });
    if (admin && admin.tokens && admin.tokens.length > 0) {
      console.log("Token:", admin.tokens[admin.tokens.length - 1].token);
    } else {
      console.log("No token found for abhi@gmail.com.");
    }
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

test();
