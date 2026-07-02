const express = require('express')

const router = new express.Router()
const auth = require('../Authentication/auth')
const players = require('../Model/players')

router.get('/players/report',auth,async(req,res)=>{
    console.log("report")
    try{
        const filter = ['superadmin', 'coach', 'accountant'].includes(req.userRole) ? {} : {owner:req.currentEmp._id};
        const playersreport = await players.find(filter)
        res.status(200).json({
            success:true,
            message:"players Report  Successfully...",
            data:playersreport
        })
    }
    catch(e){
        res.status(400).json({
            success:false,
            message:"Not Show",
            error:e.message
        })
    }
})

module.exports = router;
