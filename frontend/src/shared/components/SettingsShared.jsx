import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../common/Toast';
import { FiHome, FiGlobe, FiClock, FiUpload, FiTrash2 } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

export default function Settings() {
    const toast = useToast();
    const token = localStorage.getItem('token');

    const [settings, setSettings] = useState({
        academyName: '',
        logo: '',
        currency: '₹',
        timeZone: 'Asia/Kolkata',
        session: '2026-2027'
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.success) {
                    setSettings(res.data.data);
                }
            } catch (err) {
                toast('Failed to load academy settings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [token, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await api.put('/settings', settings);
            if (res.data.success) {
                toast('Academy Settings Updated Successfully', 'success');
                setSettings(res.data.data);
            } else {
                toast(res.data.message || 'Failed to Update Settings', 'error');
            }
        } catch (err) {
            toast(err.response?.data?.message || 'Server error during update', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            try {
                const res = await api.post('/api/upload', { image: base64Data });
                if (res.data.success) {
                    setSettings(prev => ({ ...prev, logo: res.data.url }));
                    toast('Logo image updated. Click Save to persist.', 'success');
                }
            } catch (err) {
                toast('Failed to upload logo image', 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
                <span className="text-sm font-semibold">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold font-display text-gray-800">Academy Settings</h2>
                <p className="text-sm text-gray-500">Customize global academy branding and defaults</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section: Academy Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Logo Upload Box */}
                        <div className="flex flex-col items-center p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academy Logo</span>
                            <div className="w-24 h-24 rounded-2xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden print:overflow-visible print:border-none print:shadow-none">
                                {settings.logo ? (
                                    <img src={settings.logo} alt="Academy Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-3xl">🏆</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                                    <FiUpload />
                                    <span>Upload</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </label>
                                {settings.logo && (
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, logo: '' }))}
                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                    >
                                        <FiTrash2 />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Custom fields */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Academy Name</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-400"><FiHome /></span>
                                        <input
                                            type="text"
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                            value={settings.academyName}
                                            onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Currency Symbol</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-gray-400"><FaRupeeSign /></span>
                                    <select
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer"
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    >
                                        <option value="₹">₹ (INR)</option>
                                        <option value="$">$ (USD)</option>
                                        <option value="€">€ (EUR)</option>
                                        <option value="£">£ (GBP)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time Zone</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-gray-400"><FiGlobe /></span>
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                        value={settings.timeZone}
                                        onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Session</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-gray-400"><FiClock /></span>
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                        value={settings.session}
                                        onChange={(e) => setSettings({ ...settings, session: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={updating}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-11"
                        >
                            {updating && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
