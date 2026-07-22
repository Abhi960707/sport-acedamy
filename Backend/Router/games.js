const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')
const { createAuditLog } = require('../Utils/audit')

router.get('/games/next-id', auth, async (req, res) => {
    try {
        let filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach') {
            const coachDoc = await require('../Model/coach').findOne({ email: req.currentEmp.email });
            if (coachDoc) filter.gameName = coachDoc.sportSpecialization;
        }
        const allGames = await Games.find(filter).lean();
        let maxId = 0;
        allGames.forEach(g => {
            const match = g.gameId ? g.gameId.match(/\d+/) : null;
            const num = match ? parseInt(match[0], 10) : 0;
            if (num > maxId) {
                maxId = num;
            }
        });
        const nextId = String(maxId + 1);
        res.status(200).json({
            success: true,
            nextId
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            message: "Failed to get next game ID",
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        });
    }
});


router.post('/games/add', auth, auth.allowRoles('superadmin', 'admin'), async(req, res)=>{
    try{
        if (req.body.gameName) {
            const existingGame = await Games.findOne({
                gameName: { $regex: new RegExp(`^${req.body.gameName.trim()}$`, 'i') },
                category: req.body.category,
                gameType: req.body.gameType,
                owner: req.academyOwnerId
            });
            if (existingGame) {
                return res.status(400).json({
                    success: false,
                    message: "A game with this name, category, and type already exists."
                });
            }
        }

        const gameAdd = new Games({
            gameId: req.body.gameId,
            gameName: req.body.gameName,
            category: req.body.category,
            gameType: req.body.gameType,
            duration: req.body.duration,
            gameFee: req.body.gameFee,
            gameImage: req.body.gameImage || '',
            maximumCapacity: req.body.maximumCapacity || '',
            description: req.body.description || '',
            status: req.body.status || 'Active',
            owner: req.academyOwnerId
        })

        await gameAdd.save()
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'create',
            collectionName: 'games',
            recordId: gameAdd._id.toString(),
            message: 'Game created',
            metadata: { gameId: gameAdd.gameId, gameName: gameAdd.gameName },
        })
        res.status(200).json({
            success:true,
            message:"Game Add Successfully...",
            data:gameAdd
        })
    }
    catch(e){
        res.status(400).json({
            success:false,
            message:"game not add",
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})


router.delete('/games/delete/:id', auth, auth.allowRoles('superadmin', 'admin'), async(req,res)=>{
    const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };
    const rem=await games.findOneAndDelete(filter)
    if(rem){
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'delete',
            collectionName: 'games',
            recordId: rem._id.toString(),
            message: 'Game deleted',
            metadata: { gameId: rem.gameId, gameName: rem.gameName },
        })
        res.status(200).json({
            success:true,
            message: "games is delete",
        })
    }
    else{
        res.status(404).json({
            success:false,
            message:"games is not delete"
        })
    }

})

router.put('/games/update/:id', auth, auth.allowRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };

        const gameToUpdate = await Games.findOne(filter);
        if (!gameToUpdate) {
            return res.status(404).json({ success: false, message: "Game not found or unauthorized" });
        }

        if (req.body.gameName) {
            const existingGame = await Games.findOne({
                gameName: { $regex: new RegExp(`^${req.body.gameName.trim()}$`, 'i') },
                category: req.body.category,
                gameType: req.body.gameType,
                owner: gameToUpdate.owner,
                _id: { $ne: req.params.id }
            });
            if (existingGame) {
                return res.status(400).json({
                    success: false,
                    message: "A game with this name, category, and type already exists."
                });
            }
        }

        const updatedGame = await Games.findOneAndUpdate(
            filter,
            { ...req.body },
            { new: true, runValidators: true }
        );

        createAuditLog({
            actor: req.currentEmp._id,
            action: 'update',
            collectionName: 'games',
            recordId: updatedGame._id.toString(),
            message: 'Game updated',
            metadata: { gameId: updatedGame.gameId, gameName: updatedGame.gameName },
        })

        res.status(200).json({
            success: true,
            message: "Game Updated Successfully",
            data: updatedGame
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            message: "Game update failed",
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        });
    }
});


router.get('/games/report', auth, async(req,res)=>{
    try{
        let filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        
        if (req.userRole === 'coach') {
            const coachDoc = await require('../Model/coach').findOne({ email: req.currentEmp.email });
            if (coachDoc) {
                filter.gameName = coachDoc.sportSpecialization;
            }
        }

        const data = await Games.find(filter).lean()
        res.status(200).json({
            success:true,
            data:data
        })

    }
    catch(e){
        res.status(400).json({
            success:false,
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})


module.exports = router