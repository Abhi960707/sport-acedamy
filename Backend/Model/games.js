const mongoose = require('mongoose')

const gamesSchema = mongoose.Schema({
    gameId:{
        type:String,
        required:true,

    },

    gameName:{
        type:String,
        required:true

    },
    category:{
        type:String,
        required:true
    },
    gameType:{
        type:String,
        required:true
    },
    duration:{
        type:String,
        required:true
    },
    gameFee:{
        type:String,
        required:true
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Login'
    }

})

const games = mongoose.model('games',gamesSchema)
module.exports = games