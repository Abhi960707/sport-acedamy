const fs = require('fs');

let content = fs.readFileSync('Backend/Router/attendance.js', 'utf8');

const oldGetBlock = `        if (req.userRole === 'coach') {
            const coachDoc = await require('../Model/coach').findOne({ email: req.currentEmp.email });
            if (coachDoc) {
                const myPlayers = await require('../Model/players').find({ owner: req.academyOwnerId, coachAssigned: coachDoc.name }, '_id');
                filter.playerId = { $in: myPlayers.map(p => p._id.toString()) };
            } else {
                filter.playerId = null; // force empty
            }
        }`;

const newGetBlock = `        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            const myPlayers = await require('../Model/players').find({ owner: req.academyOwnerId, coachAssigned: req.coachProfile.name }, '_id');
            filter.playerId = { $in: myPlayers.map(p => p._id.toString()) };
        }`;

content = content.split(oldGetBlock).join(newGetBlock);

const oldPostBlock = `        const filter = req.userRole === 'superadmin' ? { _id: playerId } : { _id: playerId, owner: req.academyOwnerId };
        const player = await players.findOne(filter)
        if (!player) {`;

const newPostBlock = `        const filter = req.userRole === 'superadmin' ? { _id: playerId } : { _id: playerId, owner: req.academyOwnerId };
        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            filter.coachAssigned = req.coachProfile.name;
        }
        const player = await players.findOne(filter)
        if (!player) {`;

content = content.replace(oldPostBlock, newPostBlock);

fs.writeFileSync('Backend/Router/attendance.js', content, 'utf8');
console.log('Fixed attendance.js');
