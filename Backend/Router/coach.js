const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')
const coach = require('../Model/coach')

router.get('/coach/next-id', auth, async (req, res) => {
    try {
        const allCoaches = await coach.find({ owner: req.currentEmp._id });
        let maxId = 0;
        allCoaches.forEach(c => {
            const match = c.coachId ? c.coachId.match(/\d+/) : null;
            const num = match ? parseInt(match[0], 10) : 0;
            if (num > maxId) {
                maxId = num;
            }
        });
        const nextIdVal = maxId + 1;
        const nextId = nextIdVal < 10 ? `0${nextIdVal}` : `${nextIdVal}`;
        res.status(200).json({
            success: true,
            nextId
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            message: "Failed to get next coach ID",
            error: e.message
        });
    }
});


router.post('/coach/add',auth,async(req, res)=>{
    try{
        console.log('coach')
        const coachAdd = new coach({
        coachId: req.body.coachId,
        name: req.body.name,
        sportSpecialization: req.body.sportSpecialization,
        contact: req.body.contact,
        experience: req.body.experience,
                owner: req.currentEmp._id
        })




        await coachAdd.save()
        res.status(200).json({
            success:true,
            message:"Coach Add Successfully...",
            data:coachAdd
        })
    }
    catch(e){
        res.status(400).json({
            success:false,
            message:"coach not add",
            error:e.message
            
        })
    }
})


router.delete('/coach/delete/:id',async(req,res)=>{      
        const del=await coach.findByIdAndDelete(req.params.id)
        console.log("el") 
        if(del){
            res.status(200).json({
                success:true,
                message: "coach is delete",
            })
        
        }
        else{
            res.status(400).json({
                success:false,
                message:"coach is not delete"
            })
        }
        
})

router.put('/coach/update/:id', auth, async (req, res) => {
    try {
        const updatedCoach = await coach.findOneAndUpdate(
            { _id: req.params.id, owner: req.currentEmp._id },
            {
                name: req.body.name,
                sportSpecialization: req.body.sportSpecialization,
                contact: req.body.contact,
                experience: req.body.experience,
            },
            { new: true }
        );
        if (!updatedCoach) {
            return res.status(404).json({ success: false, message: "Coach not found or unauthorized" });
        }
        res.status(200).json({ success: true, message: "Coach updated successfully", data: updatedCoach });
    } catch (e) {
        res.status(400).json({ success: false, message: "Failed to update coach", error: e.message });
    }
});

module.exports = router;