const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const players = require('../Model/players')

router.post('/players/add',auth,async(req, res)=>{
    try{
        console.log('players')
        const playersAdd = new players({
        playerId: req.body.playerId,
        fullName: req.body.fullName,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        contactNumber: req.body.contactNumber,
        email: req.body.email,
        address: req.body.address,
        sportChosen: req.body.sportChosen,
        coachAssigned: req.body.coachAssigned,
        joiningDate: req.body.joiningDate,
        totalFee: req.body.totalFee,
        payingFee: req.body.payingFee,
        pendingFee: req.body.pendingFee,
        owner: req.currentEmp._id
        })

        await playersAdd.save()
        res.status(200).json({
            success:true,
            message:"player Add Successfully...",
            data:playersAdd
        })
    }
    catch(e){
        res.status(400).json({
            success:false,
            message:"player not add",
            error:e.error
            
        })
    }
})


router.delete('/players/delete/:id',async(req,res)=>{
    const remove=await players.findByIdAndDelete(req.params.id)
    console.log("re")

    if(remove){
        res.status(200).json({
            success:true,
            message: "players is delete",
        })
    }
     else{
        res.status(400).json({
            success:false,
            message:"players is not delete"
        })
     }
})

module.exports = router;