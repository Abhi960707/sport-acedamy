const express = require('express')

const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')

router.get('/games/report',auth,async(req,res)=>{
    console.log("report")
    const gamereport = await games.find({owner:req.currentEmp._id})
    try{
    res.status(200).json({
            success:true,
            message:"games Report  Successfully...",
            data:gamereport
        })
    }
    catch(e){
    
        res.status(400).json({
            success:false,
            message:"Not Show",
            error:e.error
            
        })
    }
})

module.exports = router;
