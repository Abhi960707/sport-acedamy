const express = require('express')

const router = new express.Router()
const auth = require('../Authentication/auth')
const coach = require('../Model/coach')

router.get('/coach/report',auth,async(req,res)=>{
    console.log("report")
    const coachreport = await coach.find({owner:req.currentEmp._id})
    try{
    res.status(200).json({
            success:true,
            message:"coach Report  Successfully...",
            data:coachreport
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
