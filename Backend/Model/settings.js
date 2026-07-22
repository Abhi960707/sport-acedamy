const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    academyName: {
        type: String,
        default: 'Sport Academy',
    },
    logo: {
        type: String,
        default: '',
    },
    currency: {
        type: String,
        default: '₹',
    },
    timeZone: {
        type: String,
        default: 'Asia/Kolkata',
    },
    session: {
        type: String,
        default: '2026-2027',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Login',
        unique: true
    },
    academyCode: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
