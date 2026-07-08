const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const players = require('../Model/players')
const { createAuditLog } = require('../Utils/audit')

router.get('/players/next-id', auth, async (req, res) => {
    try {
        const filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        const allPlayers = await players.find(filter);
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

router.post('/players/add', auth, auth.allowRoles('superadmin', 'admin'), async(req, res)=>{
    try{
        if (req.body.contactNumber === req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Contact number and Email cannot be the same"
            });
        }
        
        const existingEmail = await players.findOne({ email: req.body.email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email address already exists" });
        }
        const existingContact = await players.findOne({ contactNumber: req.body.contactNumber });
        if (existingContact) {
            return res.status(400).json({ success: false, message: "Contact number already exists" });
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
            playerImage: req.body.playerImage || '',
            emergencyContact: req.body.emergencyContact || '',
            owner: req.academyOwnerId
        })

        await playersAdd.save()
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'create',
            collectionName: 'players',
            recordId: playersAdd._id.toString(),
            message: 'Player created',
            metadata: { playerId: playersAdd.playerId, fullName: playersAdd.fullName },
        })
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


router.delete('/players/delete/:id', auth, auth.allowRoles('superadmin', 'admin'), async(req,res)=>{
    const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };
    const remove=await players.findOneAndDelete(filter)

    if(remove){
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'delete',
            collectionName: 'players',
            recordId: remove._id.toString(),
            message: 'Player deleted',
            metadata: { playerId: remove.playerId, fullName: remove.fullName },
        })
        res.status(200).json({
            success:true,
            message: "players is delete",
        })
    }
     else{
        res.status(404).json({
            success:false,
            message:"players is not delete"
        })
     }
})

router.get('/players', auth, async (req, res) => {
    try {
        let filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach' && req.coachProfile) {
            filter.coachAssigned = req.coachProfile.name;
        } else if (req.userRole === 'coach') {
            return res.status(403).json({ success: false, message: "Coach profile not found" });
        }
        const allPlayers = await players.find(filter)
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


router.put('/players/update/:id', auth, auth.allowRoles('superadmin', 'admin'), async (req, res) => {
    try {
        if (req.body.contactNumber === req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Contact number and Email cannot be the same"
            });
        }
        const existingEmail = await players.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email address already exists" });
        }
        const existingContact = await players.findOne({ contactNumber: req.body.contactNumber, _id: { $ne: req.params.id } });
        if (existingContact) {
            return res.status(400).json({ success: false, message: "Contact number already exists" });
        }
        const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };
        const updatedPlayer = await players.findOneAndUpdate(
            filter,
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
                playerImage: req.body.playerImage,
                emergencyContact: req.body.emergencyContact,
            },
            { new: true }
        );
        if (!updatedPlayer) {
            return res.status(404).json({ success: false, message: "Player not found or unauthorized" });
        }
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'update',
            collectionName: 'players',
            recordId: updatedPlayer._id.toString(),
            message: 'Player updated',
            metadata: { playerId: updatedPlayer.playerId, fullName: updatedPlayer.fullName },
        })
        res.status(200).json({ success: true, message: "Player updated successfully", data: updatedPlayer });
    } catch (e) {
        res.status(400).json({ success: false, message: "Failed to update player", error: e.message });
    }
});

module.exports = router;