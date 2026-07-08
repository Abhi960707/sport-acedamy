require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./Model/payment');
const AuditLog = require('./Model/auditLog');
const Login = require('./Model/login');

async function migratePayments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sportAcademy', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected.');

    const legacyPayments = await Payment.find({ receivedById: null });
    console.log(`Found ${legacyPayments.length} legacy payments to migrate.`);

    for (let payment of legacyPayments) {
      // Find the audit log that created this payment
      const audit = await AuditLog.findOne({
        collectionName: 'payments',
        recordId: payment._id.toString(),
        action: 'create'
      }).sort({ createdAt: 1 });

      if (audit && audit.actor) {
        const actorUser = await Login.findById(audit.actor);
        if (actorUser) {
          payment.receivedById = actorUser._id;
          payment.receivedByRole = actorUser.role || 'admin';
          await payment.save();
          console.log(`Updated payment ${payment._id} with actor ${actorUser.name} (${actorUser.role})`);
        } else {
          console.log(`Audit log found for payment ${payment._id}, but user ${audit.actor} no longer exists.`);
        }
      } else {
        console.log(`No audit log found for payment ${payment._id}`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePayments();
