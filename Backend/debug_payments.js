require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./Model/payment');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sportacademy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const allPayments = await Payment.find({});
  console.log(`Total payments: ${allPayments.length}`);
  const missing = allPayments.filter(p => !p.receivedById);
  console.log(`Payments missing receivedById: ${missing.length}`);
  console.log(missing.map(p => ({id: p._id, receivedById: p.receivedById})));
  process.exit(0);
}
debug();
