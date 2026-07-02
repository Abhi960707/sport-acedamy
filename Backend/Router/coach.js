const express = require('express')
const Games = require('../Model/games')
const router = new express.Router()
const auth = require('../Authentication/auth')
const games = require('../Model/games')
const coach = require('../Model/coach')
const { createAuditLog } = require('../Utils/audit')

router.get('/coach/next-id', auth, async (req, res) => {
    try {
        const filter = ['superadmin', 'coach', 'accountant'].includes(req.userRole) ? {} : { owner: req.currentEmp._id };
        const allCoaches = await coach.find(filter);
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


router.post('/coach/add', auth, auth.allowRoles('superadmin', 'admin'), async(req, res)=>{
    try{
        const existingContact = await coach.findOne({ contact: req.body.contact });
        if (existingContact) {
            return res.status(400).json({ success: false, message: "Contact number already exists" });
        }
        
        const coachAdd = new coach({
            coachId: req.body.coachId,
            name: req.body.name,
            sportSpecialization: req.body.sportSpecialization,
            contact: req.body.contact,
            experience: req.body.experience,
            coachImage: req.body.coachImage || '',
            qualification: req.body.qualification || '',
            salary: req.body.salary || '',
            joiningDate: req.body.joiningDate || '',
            status: req.body.status || 'Active',
            owner: req.currentEmp._id
        })

        await coachAdd.save()
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'create',
            collectionName: 'coach',
            recordId: coachAdd._id.toString(),
            message: 'Coach created',
            metadata: { coachId: coachAdd.coachId, name: coachAdd.name },
        })
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


router.delete('/coach/delete/:id', auth, auth.allowRoles('superadmin', 'admin'), async(req,res)=>{      
        const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.currentEmp._id };
        const del=await coach.findOneAndDelete(filter)
        if(del){
            createAuditLog({
                actor: req.currentEmp._id,
                action: 'delete',
                collectionName: 'coach',
                recordId: del._id.toString(),
                message: 'Coach deleted',
                metadata: { coachId: del.coachId, name: del.name },
            })
            res.status(200).json({
                success:true,
                message: "coach is delete",
            })
        
        }
        else{
            res.status(404).json({
                success:false,
                message:"coach is not delete"
            })
        }
        
})

router.put('/coach/update/:id', auth, auth.allowRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const existingContact = await coach.findOne({ contact: req.body.contact, _id: { $ne: req.params.id } });
        if (existingContact) {
            return res.status(400).json({ success: false, message: "Contact number already exists" });
        }

        const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.currentEmp._id };
        const updatedCoach = await coach.findOneAndUpdate(
            filter,
            {
                name: req.body.name,
                sportSpecialization: req.body.sportSpecialization,
                contact: req.body.contact,
                experience: req.body.experience,
                coachImage: req.body.coachImage,
                qualification: req.body.qualification,
                salary: req.body.salary,
                joiningDate: req.body.joiningDate,
                status: req.body.status,
            },
            { new: true }
        );
        if (!updatedCoach) {
            return res.status(404).json({ success: false, message: "Coach not found or unauthorized" });
        }
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'update',
            collectionName: 'coach',
            recordId: updatedCoach._id.toString(),
            message: 'Coach updated',
            metadata: { coachId: updatedCoach.coachId, name: updatedCoach.name },
        })
        res.status(200).json({ success: true, message: "Coach updated successfully", data: updatedCoach });
    } catch (e) {
        res.status(400).json({ success: false, message: "Failed to update coach", error: e.message });
    }
});

module.exports = router;