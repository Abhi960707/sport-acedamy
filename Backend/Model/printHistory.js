const mongoose = require('mongoose');

const printHistorySchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true
    },
    playerName: {
        type: String,
        required: true
    },
    printedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Login',
        required: true
    },
    role: {
        type: String,
        required: true
    },
    printDate: {
        type: String,
        required: true
    },
    printTime: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: 'Registration Form Print'
    },
    printCount: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

module.exports = mongoose.model('PrintHistory', printHistorySchema);
