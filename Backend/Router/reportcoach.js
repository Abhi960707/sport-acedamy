const express = require('express')

const router = new express.Router()
const auth = require('../Authentication/auth')
const coach = require('../Model/coach')

router.get('/coach/report', auth, async(req,res)=>{
    try{

        const filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            filter._id = req.coachProfile._id;
        }
        const coachreport = await coach.find(filter).lean()
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
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

module.exports = router;
