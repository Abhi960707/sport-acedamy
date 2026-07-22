const mongoose = require('mongoose')

const coachSchema = mongoose.Schema({
    coachId:{
        type:String,
        required:true,

    },

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    sportSpecialization:{
        type:String,
        required:true
    },
    contact:{
        type:String,
        required:true
    },
    experience:{
        type:String,
        required:true
    },
    coachImage:{
        type:String,
        default:''
    },
    qualification:{
        type:String,
        default:''
    },
    salary:{
        type:String,
        default:''
    },
    joiningDate:{
        type:String,
        default:''
    },
    status:{
        type:String,
        default:'Active'
    },
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Login'
    },
    bloodGroup: {
        type: String,
        default: ''
    },
    emergencyContact: {
        type: String,
        default: ''
    }
}, { timestamps: true });

coachSchema.index({ owner: 1, email: 1 });

const coach = mongoose.model('coach',coachSchema)
module.exports = coach