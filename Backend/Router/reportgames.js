const express = require('express')

const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')

router.get('/games/report', auth, async(req,res)=>{
    try{

        const filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach' && req.coachProfile) {
            filter.gameName = req.coachProfile.sportSpecialization;
        } else if (req.userRole === 'coach') {
            return res.status(403).json({ success: false, message: "Coach profile not found" });
        }
        const gamereport = await games.find(filter)
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
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

module.exports = router;
