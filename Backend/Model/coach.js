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
    
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Login'
    }


    

})

const coach = mongoose.model('coach',coachSchema)
module.exports = coach