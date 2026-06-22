const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const players = require('../Model/players')

router.get('/players/next-id', auth, async (req, res) => {
    try {
        const allPlayers = await players.find({ owner: req.currentEmp._id });
        let maxId = 0;
        allPlayers.forEach(p => {
            const match = p.playerId ? p.playerId.match(/\d+/) : null;
            const num = match ? parseInt(match[0], 10) : 0;
            if (num > maxId) {
                maxId = num;
            }
        });
        const nextIdVal = maxId + 1;
        let nextId = `${nextIdVal}`;
        if (nextIdVal < 10) {
            nextId = `00${nextIdVal}`;
        } else if (nextIdVal < 100) {
            nextId = `0${nextIdVal}`;
        }
        res.status(200).json({
            success: true,
            nextId
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            message: "Failed to get next player ID",
            error: e.message
        });
    }
});

router.post('/players/add',auth,async(req, res)=>{
    try{
        console.log('players')
        if (req.body.contactNumber === req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Contact number and Email cannot be the same"
            });
        }
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
            error:e.message
            
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

router.get('/players', async (req, res) => {
    try {
        const allPlayers = await players.find()
        res.status(200).json({
            success: true,
            data: allPlayers
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: "Players not found"
        })
    }
})


router.put('/players/update/:id', auth, async (req, res) => {
    try {
        if (req.body.contactNumber === req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Contact number and Email cannot be the same"
            });
        }
        const updatedPlayer = await players.findOneAndUpdate(
            { _id: req.params.id, owner: req.currentEmp._id },
            {
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
            },
            { new: true }
        );
        if (!updatedPlayer) {
            return res.status(404).json({ success: false, message: "Player not found or unauthorized" });
        }
        res.status(200).json({ success: true, message: "Player updated successfully", data: updatedPlayer });
    } catch (e) {
        res.status(400).json({ success: false, message: "Failed to update player", error: e.message });
    }
});

module.exports = router;