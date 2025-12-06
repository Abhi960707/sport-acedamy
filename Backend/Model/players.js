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

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Login'
    }

})

const players = mongoose.model('players',playersSchema)
module.exports = players