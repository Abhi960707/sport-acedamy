const express = require('express')

const router = new express.Router()
const auth = require('../Authentication/auth')
const players = require('../Model/players')

router.get('/players/report', auth, async(req,res)=>{
    try{

        const filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach' && req.coachProfile) {
            filter.coachAssigned = req.coachProfile.name;
        } else if (req.userRole === 'coach') {
            return res.status(403).json({ success: false, message: "Coach profile not found" });
        }
        const playersreport = await players.find(filter).lean()
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
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

module.exports = router;
