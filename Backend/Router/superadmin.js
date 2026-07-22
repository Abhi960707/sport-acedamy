const express = require('express');
const router = new express.Router();
const auth = require('../Authentication/auth');
const Login = require('../Model/login');
const Settings = require('../Model/settings');
const Coach = require('../Model/coach');
const Players = require('../Model/players');
const Games = require('../Model/games');
const Payment = require('../Model/payment');
const Attendance = require('../Model/attendance');
const Notification = require('../Model/notification');
const AuditLog = require('../Model/auditLog');

router.get('/superadmin/dashboard-stats', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const totalAcademies = await Settings.countDocuments();
        const totalAdmins = await Login.countDocuments({ role: 'admin' });
        const totalCoaches = await Coach.countDocuments();
        const totalPlayers = await Players.countDocuments();
        const totalGames = await Games.countDocuments();
        
        // Use exact logic of existing backend but aggregated globally
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceRecords = await Attendance.find().lean();
        let presentCount = 0;
        let absentCount = 0;
        attendanceRecords.forEach(record => {
            if (record.status && record.status.toLowerCase() === 'present') presentCount++;
            if (record.status && record.status.toLowerCase() === 'absent') absentCount++;
        });
        const totalAttendance = presentCount + absentCount;

        const payments = await Payment.find().lean();
        const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const todaysPayments = await Payment.find({ paymentDate: { $gte: today } }).lean();
        const todayCollection = todaysPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        const allPlayers = await Players.find().lean();
        const totalPendingFees = allPlayers.reduce((sum, p) => sum + (parseFloat(p.pendingFee) || 0), 0);

        const activeAcademies = await Settings.countDocuments({ status: { $ne: 'Inactive' } }); // Assuming no status means active
        const inactiveAcademies = await Settings.countDocuments({ status: 'Inactive' });

        const notificationCount = await Notification.countDocuments();
        const auditLogCount = await AuditLog.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalAcademies,
                totalAdmins,
                totalCoaches,
                totalPlayers,
                totalGames,
                totalAttendance,
                totalRevenue,
                totalPendingFees,
                todayCollection,
                activeAcademies,
                inactiveAcademies,
                notificationCount,
                auditLogCount
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch system stats' });
    }
});

// Academy Management by Superadmin
router.get('/superadmin/academies', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const academies = await Settings.find().lean().populate('owner', 'name email');
        res.status(200).json({ success: true, data: academies });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch academies' });
    }
});

// Admin Management by Superadmin
router.get('/superadmin/admins', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const admins = await Login.find({ role: 'admin' }).lean();
        const adminIds = admins.map(a => a._id);
        const settings = await Settings.find({ owner: { $in: adminIds } }).lean();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.owner.toString()] = s.academyName;
        });

        const data = admins.map(a => ({
            ...a,
            academyName: settingsMap[a._id.toString()] || 'Not Configured'
        }));

        res.status(200).json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message || 'Failed to fetch admins' });
    }
});


// Create Admin
router.post('/superadmin/admins/create', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const { name, email, password, role, contactNumber, academyName } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, Email, and Password are required' });
        }

        const emailLower = String(email).trim().toLowerCase();
        const existingUser = await Login.findOne({ email: emailLower });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });
        
        const newAdmin = new Login({
            name: String(name).trim(),
            email: emailLower,
            password,
            plainPassword: password,
            role: role || 'admin',
            contactNumber: contactNumber || ''
        });
        await newAdmin.save();

        if (academyName) {
            const newSettings = new Settings({
                owner: newAdmin._id,
                academyName: String(academyName).trim()
            });
            await newSettings.save();
        }

        res.status(201).json({ success: true, message: 'Admin created successfully', data: newAdmin });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Failed to create admin' });
    }
});

// Update Admin
router.put('/superadmin/admins/update/:id', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const admin = await Login.findById(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        
        const { name, email, password, role, contactNumber, academyName } = req.body;
        if (email && email !== admin.email) {
            const emailLower = String(email).trim().toLowerCase();
            const existing = await Login.findOne({ email: emailLower });
            if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
            admin.email = emailLower;
        }
        if (name) admin.name = String(name).trim();
        if (role) admin.role = role;
        if (contactNumber !== undefined) admin.contactNumber = contactNumber;
        if (password) {
            admin.password = password;
            admin.plainPassword = password;
        }
        
        await admin.save();

        if (academyName !== undefined) {
            await Settings.findOneAndUpdate(
                { owner: admin._id },
                { academyName: academyName ? String(academyName).trim() : 'Sport Academy' },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ success: true, message: 'Admin updated successfully', data: admin });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Failed to update admin' });
    }
});

// Delete Admin
router.delete('/superadmin/admins/delete/:id', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const admin = await Login.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        
        // Also delete associated settings
        await Settings.deleteOne({ owner: req.params.id });

        res.status(200).json({ success: true, message: 'Admin deleted successfully' });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Failed to delete admin' });
    }
});

// Login Log Report for Superadmin
router.get('/superadmin/login-log', auth, auth.allowRoles('superadmin'), async (req, res) => {
    try {
        const admins = await Login.find({ role: 'admin' }).lean();
        const logData = await Promise.all(admins.map(async (admin) => {
            const settings = await Settings.findOne({ owner: admin._id }).lean();
            const academyName = settings ? settings.academyName : 'N/A';

            const coaches = await Coach.find({ owner: admin._id }).lean();
            const coachEmails = coaches.map(c => String(c.email || '').trim().toLowerCase());
            const coachLogins = await Login.find({ email: { $in: coachEmails }, role: 'coach' }).lean();
            const coachLoginMap = {};
            coachLogins.forEach(cl => {
                const clEmailLower = String(cl.email || '').trim().toLowerCase();
                coachLoginMap[clEmailLower] = cl.plainPassword || '';
            });

            const coachesList = coaches.map(c => {
                const cEmailLower = String(c.email || '').trim().toLowerCase();
                return {
                    name: c.name,
                    email: c.email,
                    contact: c.contact,
                    plainPassword: coachLoginMap[cEmailLower] || ''
                };
            });

            const playerCount = await Players.countDocuments({ owner: admin._id });
            const payments = await Payment.find({ owner: admin._id }).lean();
            const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            return {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                contactNumber: admin.contactNumber || 'N/A',
                plainPassword: admin.plainPassword || '',
                academyName,
                coachesCount: coaches.length,
                playerCount,
                totalRevenue,
                coaches: coachesList
            };
        }));

        res.status(200).json({ success: true, data: logData });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message || 'Failed to fetch login logs' });
    }
});

module.exports = router;
