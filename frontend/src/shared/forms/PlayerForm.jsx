import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../common/Toast';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiPrinter } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import api, { API_BASE } from '../../api';
import PlayerRegistrationPrint from '../components/PlayerRegistrationPrint';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  if (url.startsWith('/uploads')) {
    return `${API_BASE}${url}`;
  }
  
  if (url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    return `${API_BASE}/uploads/${filename}`;
  }
  
  return url;
};


const INITIAL_STATE = {
  playerId: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  contactNumber: '',
  email: '',
  address: '',
  sportChosen: '',
  gameCategory: '',
  gameType: '',
  coachAssigned: '',
  joiningDate: '',
  totalFee: '',
  payingFee: '',
  pendingFee: '',
  playerImage: '',
  emergencyContact: '',
};

function PlayerAdd({ role }) {
  const toast = useToast();
  const [addPlayers, setAddPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('playerFormDraft');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem('playerFormDraft', JSON.stringify(addPlayers));
  }, [addPlayers]);
  const [loading, setLoading] = useState(false);
  const [gamesList, setGamesList] = useState([]);
  const [coachesList, setCoachesList] = useState([]);
  const [errors, setErrors] = useState({});
  const [newlyRegisteredPlayer, setNewlyRegisteredPlayer] = useState(null);
  const [academySettings, setAcademySettings] = useState(null);

  useEffect(() => {
    const fetchAcademySettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success) {
          setAcademySettings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load academy settings:', err);
      }
    };
    fetchAcademySettings();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await api.post('/api/upload', { image: base64Data });
        const data = res.data;
        if (data.success) {
          setAddPlayers(prev => ({ ...prev, playerImage: data.url }));
          toast('Image uploaded successfully', 'success');
        } else {
          toast('Upload failed', 'error');
        }
      } catch (err) {
        toast('Failed to upload image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const calculatedAge = React.useMemo(() => {
    if (!addPlayers.dateOfBirth) return '';
    const dob = new Date(addPlayers.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : '';
  }, [addPlayers.dateOfBirth]);

  const fetchNextId = async () => {
    try {
      const res = await api.get('/players/next-id');
      const result = res.data;
      if (result.success) {
        setAddPlayers(prev => ({ ...prev, playerId: result.nextId }));
      }
    } catch (err) {
      console.error('Error fetching next player ID:', err);
    }
  };

  const fetchOptionsData = async (signal) => {
    try {
      const [gamesRes, coachesRes] = await Promise.all([
        api.get('/games/report'),
        api.get('/coach/report'),
      ]);
      if (signal && signal.aborted) return;
      const gamesData = gamesRes.data;
      const coachesData = coachesRes.data;

      if (gamesData.success) {
        setGamesList(gamesData.data || []);
      }
      if (coachesData.success) {
        setCoachesList(coachesData.data || []);
      }
    } catch (err) {
      console.error('Error fetching dynamic select options:', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNextId();
    fetchOptionsData(controller.signal);
    return () => controller.abort();
  }, []);

  const validate = () => {
    const tempErrors = {};
    if (!addPlayers.fullName || addPlayers.fullName.trim().length < 3) tempErrors.fullName = 'Full name must be at least 3 characters';
    if (!addPlayers.dateOfBirth) tempErrors.dateOfBirth = 'Date of birth is required';
    if (addPlayers.dateOfBirth && new Date(addPlayers.dateOfBirth) > new Date()) tempErrors.dateOfBirth = 'Date of birth cannot be in the future';
    if (!addPlayers.gender) tempErrors.gender = 'Gender selection is required';
    
    if (!addPlayers.contactNumber) {
      tempErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(addPlayers.contactNumber)) {
      tempErrors.contactNumber = 'Contact must be a valid 10-digit number';
    }

    if (!addPlayers.emergencyContact) {
      tempErrors.emergencyContact = 'Emergency contact is required';
    } else if (!/^\d{10}$/.test(addPlayers.emergencyContact)) {
      tempErrors.emergencyContact = 'Emergency contact must be a valid 10-digit number';
    }

    if (!addPlayers.email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(addPlayers.email)) {
      tempErrors.email = 'Invalid email address format';
    }

    if (!addPlayers.address || addPlayers.address.trim().length < 5) tempErrors.address = 'Full address is required';
    if (!addPlayers.sportChosen) tempErrors.sportChosen = 'Sport selection is required';
    if (addPlayers.sportChosen && !addPlayers.gameCategory) tempErrors.gameCategory = 'Category is required';
    if (addPlayers.sportChosen && addPlayers.gameCategory && !addPlayers.gameType) tempErrors.gameType = 'Game type is required';
    if (!addPlayers.coachAssigned) tempErrors.coachAssigned = 'Coach assignment is required';
    if (!addPlayers.joiningDate) tempErrors.joiningDate = 'Joining date is required';
    if (addPlayers.joiningDate && new Date(addPlayers.joiningDate) > new Date()) tempErrors.joiningDate = 'Joining date cannot be in the future';
    
    const tf = parseFloat(addPlayers.totalFee) || 0;
    const pf = parseFloat(addPlayers.payingFee) || 0;
    if (addPlayers.payingFee === '') {
      tempErrors.payingFee = 'Paying fee is required';
    } else if (isNaN(pf) || pf < 0) {
      tempErrors.payingFee = 'Paying fee must be a positive number';
    } else if (pf > tf) {
      tempErrors.payingFee = `Paying fee (₹${pf}) cannot exceed Total fee (₹${tf})`;
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePlayers = (e) => {
    let { name, value } = e.target;
    
    if (name === 'contactNumber' || name === 'emergencyContact') {
      value = value.replace(/\D/g, '');
    }

    setAddPlayers(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'sportChosen') {
        updated.gameCategory = '';
        updated.gameType = '';
        updated.totalFee = '';
        updated.payingFee = '';
        updated.pendingFee = '';
      }
      
      if (name === 'gameCategory') {
        updated.gameType = '';
        updated.totalFee = '';
        updated.payingFee = '';
        updated.pendingFee = '';
      }

      // Auto-set Total Fee when all three are selected
      if (name === 'sportChosen' || name === 'gameCategory' || name === 'gameType') {
        if (updated.sportChosen && updated.gameCategory && updated.gameType) {
          const game = gamesList.find(g => g.gameName === updated.sportChosen && g.category === updated.gameCategory && g.gameType === updated.gameType);
          const gameFee = game ? game.gameFee : '';
          updated.totalFee = gameFee;
          
          const tf = parseFloat(gameFee) || 0;
          const pf = parseFloat(updated.payingFee) || 0;
          updated.pendingFee = (tf - pf >= 0 ? tf - pf : 0).toString();
        }
      }

      // Recalculate Pending Fee when payingFee changes
      if (name === 'payingFee') {
        const tf = parseFloat(updated.totalFee) || 0;
        const pf = parseFloat(value) || 0;
        updated.pendingFee = (tf - pf >= 0 ? tf - pf : 0).toString();
      }

      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const playersSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Unable to submit the form. Please check the highlighted fields and try again.', 'warning');
      return;
    }

    if (addPlayers.contactNumber === addPlayers.email) {
      toast('Contact number and Email cannot be the same', 'warning');
      return;
    }

    if (addPlayers.sportChosen && (!addPlayers.gameCategory || !addPlayers.gameType)) {
      toast('Please select a game category and type', 'warning');
      return;
    }

    if (addPlayers.sportChosen && !addPlayers.totalFee) {
      toast('Selected sport configuration does not have a configured fee', 'warning');
      return;
    }

    const submitPayload = {
      ...addPlayers,
      sportChosen: `${addPlayers.sportChosen} (${addPlayers.gameCategory} - ${addPlayers.gameType})`
    };
    
    // Remove temp fields before sending to backend
    delete submitPayload.gameCategory;
    delete submitPayload.gameType;

    setLoading(true);
    try {
      const res = await api.post('/players/add', submitPayload);
      const result = res.data;
      if (result.success) {
        toast('Player added successfully!', 'success');
        setNewlyRegisteredPlayer(result.data);
        setAddPlayers(INITIAL_STATE);
        localStorage.removeItem('playerFormDraft');
        setErrors({});
        fetchNextId();
      } else {
        let msg = result.message || 'Failed to add player';
        toast(msg, 'error');
      }
    } catch (error) {
      let msg = 'Server error. Please try again.';
      if (error.response && error.response.data) {
        const result = error.response.data;
        msg = result.message || msg;
        if (result.error && result.error.includes('E11000')) {
          if (result.error.includes('email')) msg = 'Email address already exists';
          else if (result.error.includes('contactNumber')) msg = 'Contact number already exists';
          else msg = 'Record already exists';
        }
      }
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (role === 'coach') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-md">
          <span className="text-5xl">🚫</span>
          <h2 className="text-xl font-bold text-gray-800 mt-4">Access Denied</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Coaches do not have permission to add new players. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {newlyRegisteredPlayer && (
        <PlayerRegistrationPrint player={newlyRegisteredPlayer} academy={academySettings} />
      )}

      {/* Success Popup Modal */}
      {newlyRegisteredPlayer && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden p-6 text-center space-y-6 animate-scale-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Player Registered Successfully!</h3>
              <p className="text-xs text-gray-500 font-medium">The player enrollment is completed.</p>
            </div>

            {/* Info Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Player Name</span>
                <span className="font-bold text-gray-800">{newlyRegisteredPlayer.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Player ID</span>
                <span className="font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{newlyRegisteredPlayer.playerId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Sport / Game</span>
                <span className="font-bold text-gray-800">{newlyRegisteredPlayer.sportChosen}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Coach Assigned</span>
                <span className="font-bold text-gray-800">{newlyRegisteredPlayer.coachAssigned}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Total Fee</span>
                <span className="font-bold text-gray-900">₹{newlyRegisteredPlayer.totalFee}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FiPrinter className="text-sm" />
                <span>Print Registration Form</span>
              </button>
              <button
                type="button"
                onClick={() => setNewlyRegisteredPlayer(null)}
                className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close & Enroll Another
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 sm:px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
            🏃
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Add New Player</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Enroll a new student to the sports academy</p>
          </div>
        </div>

        {/* Form Body */}
        <form className="p-6 sm:p-8 space-y-8" onSubmit={playersSubmit} id="player-add-form" noValidate>
          
          {/* Section: Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

              {/* Player Image Upload */}
              <div className="space-y-1 sm:col-span-2 xl:col-span-3 flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 mb-2">
                <div className="w-16 h-16 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                  {addPlayers.playerImage ? (
                    <img src={getImageUrl(addPlayers.playerImage)} alt="Player Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-600 uppercase">Player Photo</div>
                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {addPlayers.playerImage && (
                      <button
                        type="button"
                        onClick={() => setAddPlayers(prev => ({ ...prev, playerImage: '' }))}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Player ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-id">Player ID</label>
                <input
                  id="player-id"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed"
                  type="text"
                  name="playerId"
                  value={addPlayers.playerId}
                  disabled={true}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-name">Full Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FiUser /></span>
                  <input
                    id="player-name"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.fullName ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="text"
                    name="fullName"
                    placeholder="Enter player name"
                    value={addPlayers.fullName}
                    onChange={handlePlayers}
                    disabled={loading}
                  />
                </div>
                {errors.fullName && <p className="text-[11px] font-semibold text-red-500">{errors.fullName}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-dob">Date of Birth</label>
                <input
                  id="player-dob"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.dateOfBirth ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="date"
                  name="dateOfBirth"
                  value={addPlayers.dateOfBirth}
                  onChange={handlePlayers}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && <p className="text-[11px] font-semibold text-red-500">{errors.dateOfBirth}</p>}
              </div>

              {/* Age */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-age">Age</label>
                <input
                  id="player-age"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
                  type="text"
                  value={calculatedAge === '' ? '' : `${calculatedAge} years`}
                  readOnly
                  aria-readonly="true"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-gender">Gender</label>
                <select
                  id="player-gender"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.gender ? 'border-red-400' : 'border-gray-200'
                  }`}
                  name="gender"
                  value={addPlayers.gender}
                  onChange={handlePlayers}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <p className="text-[11px] font-semibold text-red-500">{errors.gender}</p>}
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-contact">Contact Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FiPhone /></span>
                  <input
                    id="player-contact"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.contactNumber ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="text"
                    name="contactNumber"
                    placeholder="e.g. 9876543210"
                    value={addPlayers.contactNumber}
                    onChange={handlePlayers}
                    disabled={loading}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                  />
                </div>
                {errors.contactNumber && <p className="text-[11px] font-semibold text-red-500">{errors.contactNumber}</p>}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-emergency">Emergency Contact</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FiPhone /></span>
                  <input
                    id="player-emergency"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.emergencyContact ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="text"
                    name="emergencyContact"
                    placeholder="Emergency number"
                    value={addPlayers.emergencyContact}
                    onChange={handlePlayers}
                    disabled={loading}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                  />
                </div>
                {errors.emergencyContact && <p className="text-[11px] font-semibold text-red-500">{errors.emergencyContact}</p>}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-email">Email Address</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FiMail /></span>
                  <input
                    id="player-email"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.email ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={addPlayers.email}
                    onChange={handlePlayers}
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className="text-[11px] font-semibold text-red-500">{errors.email}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1 sm:col-span-2 md:col-span-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-address">Address</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FiMapPin /></span>
                  <input
                    id="player-address"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.address ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="text"
                    name="address"
                    placeholder="Full residential address"
                    value={addPlayers.address}
                    onChange={handlePlayers}
                    disabled={loading}
                  />
                </div>
                {errors.address && <p className="text-[11px] font-semibold text-red-500">{errors.address}</p>}
              </div>

            </div>
          </div>

          {/* Section: Academy Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Academy Registration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              
              {/* Sport Chosen */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-sport">Sport Chosen</label>
                <select
                  id="player-sport"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.sportChosen ? 'border-red-400' : 'border-gray-200'
                  }`}
                  name="sportChosen"
                  value={addPlayers.sportChosen}
                  onChange={handlePlayers}
                  disabled={loading}
                >
                  <option value="">Select Sport</option>
                  {[...new Set(gamesList.map((g) => g.gameName))].map((gameName, idx) => (
                    <option key={idx} value={gameName}>{gameName}</option>
                  ))}
                </select>
                {errors.sportChosen && <p className="text-[11px] font-semibold text-red-500">{errors.sportChosen}</p>}
              </div>

              {/* Game Category */}
              {addPlayers.sportChosen && (
              <div className="space-y-1 animate-fade-in-up">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-category">Category</label>
                <select
                  id="player-category"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.gameCategory ? 'border-red-400' : 'border-gray-200'
                  }`}
                  name="gameCategory"
                  value={addPlayers.gameCategory}
                  onChange={handlePlayers}
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {[...new Set(gamesList.filter(g => g.gameName === addPlayers.sportChosen).map(g => g.category))].map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.gameCategory && <p className="text-[11px] font-semibold text-red-500">{errors.gameCategory}</p>}
              </div>
              )}

              {/* Game Type */}
              {addPlayers.gameCategory && (
              <div className="space-y-1 animate-fade-in-up">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-type">Game Type</label>
                <select
                  id="player-type"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.gameType ? 'border-red-400' : 'border-gray-200'
                  }`}
                  name="gameType"
                  value={addPlayers.gameType}
                  onChange={handlePlayers}
                  disabled={loading}
                >
                  <option value="">Select Type</option>
                  {[...new Set(gamesList.filter(g => g.gameName === addPlayers.sportChosen && g.category === addPlayers.gameCategory).map(g => g.gameType))].map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
                {errors.gameType && <p className="text-[11px] font-semibold text-red-500">{errors.gameType}</p>}
              </div>
              )}

              {/* Coach Assigned */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-coach">Coach Assigned</label>
                <select
                  id="player-coach"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.coachAssigned ? 'border-red-400' : 'border-gray-200'
                  }`}
                  name="coachAssigned"
                  value={addPlayers.coachAssigned}
                  onChange={handlePlayers}
                  disabled={loading}
                >
                  <option value="">Select Coach</option>
                  {(() => {
                    if (!addPlayers.sportChosen) return coachesList;
                    const baseSport = addPlayers.sportChosen;
                    const specialized = coachesList.filter(c => c.sportSpecialization === baseSport);
                    const others = coachesList.filter(c => c.sportSpecialization !== baseSport);
                    return [...specialized, ...others];
                  })().map((c) => (
                    <option key={c._id} value={c.name}>{c.name} ({c.sportSpecialization})</option>
                  ))}
                </select>
                {errors.coachAssigned && <p className="text-[11px] font-semibold text-red-500">{errors.coachAssigned}</p>}
              </div>

              {/* Joining Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-joining">Joining Date</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FiCalendar /></span>
                  <input
                    id="player-joining"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                      errors.joiningDate ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="date"
                    name="joiningDate"
                    value={addPlayers.joiningDate}
                    onChange={handlePlayers}
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.joiningDate && <p className="text-[11px] font-semibold text-red-500">{errors.joiningDate}</p>}
              </div>

            </div>
          </div>

          {/* Section: Fee Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Fee Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Total Fee (ReadOnly) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-totalfee">Total Fee (₹)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                  <input
                    id="player-totalfee"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
                    type="text"
                    name="totalFee"
                    placeholder="0.00"
                    value={addPlayers.totalFee}
                    readOnly={true}
                  />
                </div>
              </div>

              {/* Paying Fee */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-paying">Paying Fee (₹)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                  <input
                    id="player-paying"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.payingFee ? 'border-red-400' : 'border-gray-200'
                    }`}
                    type="number"
                    name="payingFee"
                    placeholder="0.00"
                    value={addPlayers.payingFee}
                    onChange={handlePlayers}
                    disabled={loading}
                    min="0"
                    step="1"
                  />
                </div>
                {errors.payingFee && <p className="text-[11px] font-semibold text-red-500">{errors.payingFee}</p>}
              </div>

              {/* Pending Fee (ReadOnly) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="player-pending">Pending Fee (₹)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                  <input
                    id="player-pending"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
                    type="text"
                    name="pendingFee"
                    placeholder="0.00"
                    value={addPlayers.pendingFee}
                    readOnly={true}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
            <button
              id="player-reset-btn"
              type="button"
              className="px-6 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm font-bold rounded-xl transition-all cursor-pointer text-center"
              onClick={() => {
                setAddPlayers(INITIAL_STATE);
                localStorage.removeItem('playerFormDraft');
                setErrors({});
                fetchNextId();
              }}
              disabled={loading}
            >
              Reset
            </button>
            <button
              id="player-submit-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all disabled:opacity-55 cursor-pointer flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {loading ? 'Saving...' : 'Save Player'}
            </button>
          </div>
        </form>

        </div>
      </div>
    </>
  );
}

export default PlayerAdd;
