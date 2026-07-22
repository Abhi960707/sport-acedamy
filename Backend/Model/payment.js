const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true,
    },
    playerName: {
        type: String,
        required: true,
    },
    paymentDate: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'UPI', 'Card', 'cash', 'upi', 'card', 'bank_transfer', 'Bank Transfer'],
    },
    transactionId: {
        type: String,
        default: '',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Login',
    },
    receivedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Login',
        default: null
    },
    receivedByRole: {
        type: String,
        default: ''
    },
    receiptNumber: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    }
}, { timestamps: true });

paymentSchema.index({ owner: 1, playerId: 1, paymentDate: -1 });

paymentSchema.index({ playerId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
