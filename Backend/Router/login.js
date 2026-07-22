const express = require('express')
const Login = require('../Model/login')
const Settings = require('../Model/settings')
const Coach = require('../Model/coach')
const router = new express.Router()
const auth = require('../Authentication/auth')
const rateLimit = require('express-rate-limit')
const validator = require('validator')
const { createAuditLog } = require('../Utils/audit')
const bcrypt = require('bcrypt')

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.'
    }
})

const validateSignupBody = (body) => {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = String(body.role || 'admin').toLowerCase();

    if (!name || name.length < 3) {
        return 'Name must be at least 3 characters';
    }
    if (!validator.isAlpha(name.replace(/\s+/g, ''))) {
        return 'Only alphabate are allowed';
    }
    if (!validator.isEmail(email)) {
        return 'Enter valid email id';
    }
    if (!password || password.length < 4) {
        return 'Password must be at least 4 characters';
    }
    if (!['superadmin', 'admin', 'coach', 'accountant'].includes(role)) {
        return 'Invalid role selected';
    }

    return null;
};

router.get('/login/test',async(req,res)=>{
    res.send({msg:"test router"})
})

router.post('/login/signup', async(req,res)=>{
    try{
        const validationError = validateSignupBody(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const email = String(req.body.email || '').trim().toLowerCase();
        const existingUser = await Login.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const templogin = new Login({
            name: String(req.body.name || '').trim(),
            email,
            password: req.body.password,
            plainPassword: req.body.password,
            role: String(req.body.role || 'admin').toLowerCase()
        })
        await templogin.save()
        res.status(201).send({
            success:true,
            message:"Signup Successfully"
        })
    }
    catch(e){
        const statusCode = e.code === 11000 ? 409 : 500;
        res.status(statusCode).send({
            success:false,
            message: statusCode === 409 ? 'Email already exists' : 'some error',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

router.post('/login/login', async(req,res)=>{
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success:false,
            message:'Enter valid email id'
        });
    }

    if (!password) {
        return res.status(400).json({
            success:false,
            message:'Password is required'
        });
    }

    try{
        const userlogin = await Login.loginCheck(email,password)
        const token = await userlogin.generateToken()
        createAuditLog({
            actor: userlogin._id,
            action: 'login',
            collectionName: 'Login',
            recordId: userlogin._id.toString(),
            message: 'User logged in successfully',
            metadata: { email: userlogin.email, role: userlogin.role || 'admin' },
        })
        res.status(200).json({
            success:true,
            message:"login Successfully...",
            token,
            user: {
                _id: userlogin._id,
                name: userlogin.name,
                email: userlogin.email,
                role: userlogin.role || 'admin'
            }
        })
    }
    catch(e){
        const statusCode = e.message.includes('User not found') || e.message.includes('Incorrect password') ? 401 : 500;
        res.status(statusCode).json({
            success:false,
            message: statusCode === 401 ? 'Invalid email or password' : 'login failed',error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

router.post('/login/logout',auth, async(req,res)=>{
    // res.send("ok")
    try{
        req.currentEmp.tokens = req.currentEmp.tokens.filter((e)=>e.token!==req.token)
        await req.currentEmp.save()
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'logout',
            collectionName: 'Login',
            recordId: req.currentEmp._id.toString(),
            message: 'User logged out successfully',
            metadata: { email: req.currentEmp.email, role: req.currentEmp.role || 'admin' },
        })
        res.status(200).json({
            message:"logout Successfully..."
        })
    }
    catch(e){
        res.status(500).json({
        message:"Failed To log out...",error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

router.get('/auth/check-academy', auth, async (req, res) => {
    try {
        if (req.currentEmp.role === 'superadmin' || req.currentEmp.role === 'coach') {
            return res.status(200).json({ success: true, hasAcademy: true });
        }
        
        const academy = await Settings.findOne({ owner: req.currentEmp._id });
        res.status(200).json({ success: true, hasAcademy: !!academy });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to check academy status' });
    }
});

// Profile endpoints
router.get('/auth/profile', auth, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                _id: req.currentEmp._id,
                name: req.currentEmp.name,
                email: req.currentEmp.email,
                role: req.currentEmp.role,
                profileImage: req.currentEmp.profileImage || ''
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message });
    }
});

router.put('/auth/profile/update', auth, async (req, res) => {
    try {
        const { name, email, profileImage, coachDetails } = req.body;
        
        let newEmail = null;
        if (name) req.currentEmp.name = name;
        if (email) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ success: false, message: 'Enter valid email id' });
            }
            // Check if email already exists for another user
            const existing = await Login.findOne({ email, _id: { $ne: req.currentEmp._id } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Email already exists' });
            }
            newEmail = email.trim().toLowerCase();
            req.currentEmp.email = newEmail;
        }
        if (profileImage !== undefined) {
            req.currentEmp.profileImage = profileImage;
        }

        await req.currentEmp.save();

        if (req.currentEmp.role === 'coach' && req.coachProfile) {
            if (newEmail) req.coachProfile.email = newEmail;
            if (name) req.coachProfile.name = name;
            if (profileImage !== undefined) req.coachProfile.coachImage = profileImage;
            
            if (coachDetails) {
                if (coachDetails.sportSpecialization !== undefined) req.coachProfile.sportSpecialization = coachDetails.sportSpecialization;
                if (coachDetails.experience !== undefined) req.coachProfile.experience = coachDetails.experience;
                if (coachDetails.contact !== undefined) req.coachProfile.contact = coachDetails.contact;
                if (coachDetails.joiningDate !== undefined) req.coachProfile.joiningDate = coachDetails.joiningDate;
            }
            await req.coachProfile.save();
        }

        createAuditLog({
            actor: req.currentEmp._id,
            action: 'update',
            collectionName: 'Login',
            recordId: req.currentEmp._id.toString(),
            message: 'Profile details updated',
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: req.currentEmp._id,
                name: req.currentEmp.name,
                email: req.currentEmp.email,
                role: req.currentEmp.role,
                profileImage: req.currentEmp.profileImage || '',
                coachDetails: req.coachProfile ? req.coachProfile : undefined
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to update profile', error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message });
    }
});

router.put('/auth/profile/change-password', auth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
        }

        const isMatch = await bcrypt.compare(oldPassword, req.currentEmp.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect old password' });
        }

        req.currentEmp.password = newPassword;
        await req.currentEmp.save();

        createAuditLog({
            actor: req.currentEmp._id,
            action: 'update',
            collectionName: 'Login',
            recordId: req.currentEmp._id.toString(),
            message: 'Password changed successfully',
        });

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to change password', error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message });
    }
});

module.exports = router;