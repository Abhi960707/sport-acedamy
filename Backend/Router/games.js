const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')

router.get('/games/next-id', auth, async (req, res) => {
    try {
        const allGames = await Games.find({ owner: req.currentEmp._id });
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
            error: e.message
        });
    }
});


router.post('/games/add',auth,async(req, res)=>{
    try{
        console.log('game')
        const gameAdd = new Games({
        gameId: req.body.gameId,
        gameName: req.body.gameName,
        category: req.body.category,
        gameType: req.body.gameType,
        duration: req.body.duration,
        gameFee: req.body.gameFee,
        owner: req.currentEmp._id
        })

        await gameAdd.save()
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
            error:e.message
            
        })
    }
})


router.delete('/games/delete/:id',async(req,res)=>{
    const rem=await games.findByIdAndDelete(req.params.id)
    console.log("del")
    if(rem){
        res.status(200).json({
            success:true,
            message: "games is delete",
        })
    }
    else{
        res.status(400).json({
            success:false,
            message:"games is not delete"
        })
    }

})

router.put('/games/update/:id', auth, async (req, res) => {
    try {
        const updatedGame = await Games.findOneAndUpdate(
            { _id: req.params.id, owner: req.currentEmp._id },
            {
                gameName: req.body.gameName,
                category: req.body.category,
                gameType: req.body.gameType,
                duration: req.body.duration,
                gameFee: req.body.gameFee,
            },
            { new: true }
        );
        if (!updatedGame) {
            return res.status(404).json({ success: false, message: "Game not found or unauthorized" });
        }
        res.status(200).json({ success: true, message: "Game updated successfully", data: updatedGame });
    } catch (e) {
        res.status(400).json({ success: false, message: "Failed to update game", error: e.message });
    }
});

module.exports = router;