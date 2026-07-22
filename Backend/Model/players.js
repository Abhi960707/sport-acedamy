const mongoose = require('mongoose')

const playersSchema = mongoose.Schema({
    playerId:{
        type:String,
        required:true,

    },

    fullName:{
        type:String,
        required:true

    },
    dateOfBirth:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    contactNumber:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    sportChosen:{
        type:String,
        required:true
    },
    coachAssigned:{
        type:String,
        required:true
    },
    joiningDate:{
        type:String,
        required:true
    },
    totalFee:{
        type:String,
        required:true
    },
    payingFee:{
        type:String,
        required:true
    },
    pendingFee:{
        type:String,
        required:true
    },
    playerImage:{
        type:String,
        default:''
    },
    emergencyContact:{
        type:String,
        default:''
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Login'
    },
    guardianName: {
        type: String,
        default: ''
    },
    guardianPhone: {
        type: String,
        default: ''
    },
    bloodGroup: {
        type: String,
        default: ''
    },
    medicalNotes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'Active'
    }
}, { timestamps: true });

playersSchema.index({ owner: 1, email: 1 });

playersSchema.index({ playerId: 1 });
playersSchema.index({ email: 1 });
playersSchema.index({ sportChosen: 1 });
playersSchema.index({ pendingFee: 1 });

const players = mongoose.model('players',playersSchema)
module.exports = players