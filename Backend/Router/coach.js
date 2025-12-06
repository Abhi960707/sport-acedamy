const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')
const coach = require('../Model/coach')

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
            error:e.error
            
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


module.exports = router;