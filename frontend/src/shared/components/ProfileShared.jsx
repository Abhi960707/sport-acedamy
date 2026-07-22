import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../common/Toast';
import { FiUser, FiMail, FiLock, FiTrash2, FiCamera, FiHash, FiActivity, FiAward, FiPhone, FiCalendar } from 'react-icons/fi';

export default function Profile() {
    const toast = useToast();
    const token = localStorage.getItem('token');

    const [user, setUser] = useState({
        name: '',
        email: '',
        profileImage: '',
        role: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Password fields
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                if (res.data.success) {
                    let fetchedUser = res.data.user;
                    
                    if (fetchedUser.role === 'coach') {
                        try {
                            const coachRes = await api.get('/coach/report');
                            if (coachRes.data.success && coachRes.data.data.length > 0) {
                                fetchedUser.coachDetails = coachRes.data.data[0];
                            }
                        } catch(e) {}
                    }
                    
                    setUser(fetchedUser);
                }
            } catch (err) {
                toast('Failed to load profile details', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token, toast]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!user.name || !user.email) {
            toast('Name and email are required', 'warning');
            return;
        }
        setUpdating(true);
        try {
            const res = await api.put('/auth/profile/update', user);
            if (res.data.success) {
                toast('Profile updated successfully', 'success');
                setUser(res.data.user);
                localStorage.setItem('authUser', JSON.stringify(res.data.user));
                setIsEditing(false);
            } else {
                toast(res.data.message || 'Failed to update profile', 'error');
            }
        } catch (err) {
            toast(err.response?.data?.message || 'Server error during update', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const { oldPassword, newPassword, confirmNewPassword } = passwordData;
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            toast('Please fill in all password fields', 'warning');
            return;
        }
        if (newPassword.length < 4) {
            toast('Password must be at least 4 characters long', 'warning');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast('New passwords do not match', 'warning');
            return;
        }

        setPwdLoading(true);
        try {
            const res = await api.put('/auth/profile/change-password', {
                oldPassword,
                newPassword
            });
            if (res.data.success) {
                toast('Password changed successfully', 'success');
                setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                toast(res.data.message || 'Failed to change password', 'error');
            }
        } catch (err) {
            toast(err.response?.data?.message || 'Server error during password update', 'error');
        } finally {
            setPwdLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            try {
                const res = await api.post('/api/upload', { image: base64Data });
                if (res.data.success) {
                    setUser(prev => ({ ...prev, profileImage: res.data.url }));
                    toast('Image preview updated. Save details to persist.', 'success');
                }
            } catch (err) {
                toast('Failed to upload image', 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
                <span className="text-sm font-semibold">Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold font-display text-gray-800">My Profile</h2>
                <p className="text-sm text-gray-500">Update account credentials and settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left card: Profile Pic & Info */}
                <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <FiUser className="text-4xl text-gray-300" />
                            )}
                        </div>
                        <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 transition">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <FiCamera className="text-sm" />
                        </label>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                        <span className="inline-flex px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mt-1">{user.role}</span>
                    </div>

                    {user.profileImage && (
                        <button
                            type="button"
                            onClick={() => setUser(prev => ({ ...prev, profileImage: '' }))}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                            <FiTrash2 /> Remove image
                        </button>
                    )}
                </div>

                {/* Right side: Forms */}
                <div className="md:col-span-2 space-y-6">
                    {/* General Details Form */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6 space-y-4">
                        <h4 className="text-base font-bold text-gray-800">General Information</h4>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-400"><FiUser /></span>
                                        <input
                                            type="text"
                                            className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                            value={user.name}
                                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-400"><FiMail /></span>
                                        <input
                                            type="email"
                                            className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                            value={user.email}
                                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                                            required
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                            {user.role === 'coach' && user.coachDetails && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coach ID</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-gray-400"><FiHash /></span>
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
                                                value={user.coachDetails.coachId}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sport Specialization</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-gray-400"><FiActivity /></span>
                                            <select 
                                                className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none appearance-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer'}`} 
                                                value={user.coachDetails.sportSpecialization} 
                                                onChange={(e) => setUser({ ...user, coachDetails: { ...user.coachDetails, sportSpecialization: e.target.value } })}
                                                required
                                                disabled={!isEditing}
                                            >
                                                <option value="">Select Sport</option>
                                                <option value="Cricket">Cricket</option>
                                                <option value="Football">Football</option>
                                                <option value="Kabaddi">Kabaddi</option>
                                                <option value="Kho Kho">Kho Kho</option>
                                                <option value="Volleyball">Volleyball</option>
                                                <option value="Badminton">Badminton</option>
                                                <option value="Basketball">Basketball</option>
                                                <option value="Tennis">Tennis</option>
                                                <option value="Athletics">Athletics</option>
                                                <option value="Swimming">Swimming</option>
                                                <option value="Carrom">Carrom</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Experience</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-gray-400"><FiAward /></span>
                                            <input
                                                type="text"
                                                className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                                value={user.coachDetails.experience}
                                                onChange={(e) => setUser({ ...user, coachDetails: { ...user.coachDetails, experience: e.target.value } })}
                                                required
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number</label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-gray-400"><FiPhone /></span>
                                            <input
                                                type="text"
                                                className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                                value={user.coachDetails.contact}
                                                onChange={(e) => setUser({ ...user, coachDetails: { ...user.coachDetails, contact: e.target.value } })}
                                                required
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    {user.coachDetails.joiningDate !== undefined && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joining Date</label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3 text-gray-400 z-10"><FiCalendar /></span>
                                                <input
                                                    type="date"
                                                    className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                                    value={user.coachDetails.joiningDate}
                                                    onChange={(e) => setUser({ ...user, coachDetails: { ...user.coachDetails, joiningDate: e.target.value } })}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            </div>

                            <div className="flex justify-end pt-2 border-t border-gray-50 mt-4">
                                <button
                                    type={isEditing ? "submit" : "button"}
                                    disabled={updating}
                                    onClick={!isEditing ? (e) => { e.preventDefault(); setIsEditing(true); } : undefined}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-11"
                                >
                                    {updating && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
                                    {isEditing ? 'Save Details' : 'Update Details'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password Form */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6 space-y-4">
                        <h4 className="text-base font-bold text-gray-800">Change Password</h4>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-400"><FiLock /></span>
                                        <input
                                            type="password"
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-400"><FiLock /></span>
                                        <input
                                            type="password"
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-400"><FiLock /></span>
                                        <input
                                            type="password"
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                            value={passwordData.confirmNewPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={pwdLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-11"
                                >
                                    {pwdLoading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
