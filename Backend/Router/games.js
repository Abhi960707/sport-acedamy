const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')

router.post('/games/add',auth,async(req, res)=>{
    try{
        console.log('game')
        const gameAdd = new Games({
        gameId: req.body.gameId,
        gameName: req.body.gameName,
        category: req.body.category,
        gameType: req.body.gameType,
        duration: req.body.duration,
        gameFee: req.body.gameFee,
        owner: req.currentEmp._id
        })

        await gameAdd.save()
        res.status(200).json({
            success:true,
            message:"Game Add Successfully...",
            data:gameAdd
        })
    }
    catch(e){
        res.status(400).json({
            success:false,
            message:"game not add",
            error:e.error
            
        })
    }
})


router.delete('/games/delete/:id',async(req,res)=>{
    const rem=await games.findByIdAndDelete(req.params.id)
    console.log("del")
    if(rem){
        res.status(200).json({
            success:true,
            message: "games is delete",
        })
    }
    else{
        res.status(400).json({
            success:false,
            message:"games is not delete"
        })
    }

})



module.exports = router;