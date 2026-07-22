import React, { useState, useEffect } from 'react';
import { useToast } from '../../common/Toast';
import { FiAward, FiClock, FiUsers, FiFileText } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import api from '../../api';


const INITIAL_STATE = {
  gameId: '',
  gameName: '',
  category: '',
  gameType: '',
  duration: '',
  gameFee: '',
  gameImage: '',
  maximumCapacity: '',
  description: '',
  status: 'Active',
};

const PREDEFINED_GAMES = [
  'Cricket',
  'Football',
  'Kabaddi',
  'Kho Kho',
  'Volleyball',
  'Badminton',
  'Basketball',
  'Tennis',
  'Athletics',
  'Swimming',
  'Carrom'
];


function GameAdd() {
  const toast = useToast();
  const [addGame, setAddGame] = useState(() => {
    try {
      const saved = localStorage.getItem('gameFormDraft');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  const [isOtherSelected, setIsOtherSelected] = useState(() => {
    try {
      const saved = localStorage.getItem('gameFormDraft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.gameName) {
          return !PREDEFINED_GAMES.includes(parsed.gameName);
        }
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('gameFormDraft', JSON.stringify(addGame));
  }, [addGame]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});


  const fetchNextId = async () => {
    try {
      const res = await api.get('/games/next-id');
      const result = res.data;
      if (result.success) {
        setAddGame(prev => ({ ...prev, gameId: result.nextId }));
      }
    } catch (err) {
      console.error('Error fetching next game ID:', err);
    }
  };

  useEffect(() => {
    fetchNextId();
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
          setAddGame(prev => ({ ...prev, gameImage: data.url }));
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

  const validate = () => {
    const tempErrors = {};
    if (!addGame.gameName || addGame.gameName.trim().length < 2) tempErrors.gameName = 'Game name is required';
    if (!addGame.category) tempErrors.category = 'Category is required';
    if (!addGame.gameType) tempErrors.gameType = 'Game type is required';
    if (!addGame.duration || addGame.duration.trim().length < 2) tempErrors.duration = 'Duration is required';
    
    if (!addGame.gameFee) {
      tempErrors.gameFee = 'Game fee is required';
    } else if (Number(addGame.gameFee) < 0) {
      tempErrors.gameFee = 'Game fee cannot be negative';
    }

    if (!addGame.maximumCapacity) {
      tempErrors.maximumCapacity = 'Maximum capacity is required';
    } else if (Number(addGame.maximumCapacity) <= 0) {
      tempErrors.maximumCapacity = 'Capacity must be greater than zero';
    }

    if (!addGame.description || addGame.description.trim().length < 5) {
      tempErrors.description = 'Provide a brief description of at least 5 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleGame = (e) => {
    const { name, value } = e.target;
    if (name === 'gameName') {
      if (value === 'Other') {
        setIsOtherSelected(true);
        setAddGame(prev => ({ ...prev, gameName: '' }));
      } else {
        setIsOtherSelected(false);
        setAddGame(prev => ({ ...prev, gameName: value }));
      }
    } else {
      setAddGame(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const gameSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Unable to submit the form. Please check the highlighted fields and try again.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/games/add', addGame);
      const result = res.data;
      if (result.success) {
        toast('Game added successfully!', 'success');
        setAddGame(INITIAL_STATE);
        setIsOtherSelected(false);
        localStorage.removeItem('gameFormDraft');
        fetchNextId();
      } else {
        let msg = result.message || 'Failed to add game';
        toast(msg, 'error');
      }
    } catch (error) {
      let msg = 'Server error. Please try again.';
      if (error.response && error.response.data) {
        const result = error.response.data;
        msg = result.message || msg;
        if (result.error && result.error.includes('E11000')) {
          msg = 'Record already exists';
        }
      }
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 sm:px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
            <FiAward />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Add New Game</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Register a new sport type and fee details</p>
          </div>
        </div>

        {/* Form Body */}
        <form className="p-6 sm:p-8 space-y-6" onSubmit={gameSubmit} id="game-add-form" noValidate>
          
          {/* Game Photo Upload */}
          <div className="flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
              {addGame.gameImage ? (
                <img src={addGame.gameImage} alt="Game Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-2xl">🎮</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-600 uppercase">Game Icon/Image</div>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {addGame.gameImage && (
                  <button
                    type="button"
                    onClick={() => setAddGame(prev => ({ ...prev, gameImage: '' }))}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Game ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-id">Game ID</label>
              <input
                id="game-id"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed"
                type="text"
                name="gameId"
                placeholder="Auto-generating..."
                value={addGame.gameId}
                disabled={true}
              />
            </div>

            {/* Game Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-name">Game Name</label>
              <select
                id="game-name"
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                  errors.gameName ? 'border-red-400' : 'border-gray-200'
                }`}
                name="gameName"
                value={isOtherSelected ? 'Other' : addGame.gameName}
                onChange={handleGame}
                disabled={loading}
              >
                <option value="">Select Game</option>
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
                <option value="Other">Other</option>
              </select>
              {isOtherSelected && (
                <input
                  type="text"
                  name="gameName"
                  value={addGame.gameName}
                  onChange={(e) => {
                    setAddGame(prev => ({ ...prev, gameName: e.target.value }));
                    if (errors.gameName) {
                      setErrors(prev => ({ ...prev, gameName: '' }));
                    }
                  }}
                  placeholder="Enter Custom Game Name"
                  className={`w-full mt-2 px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.gameName ? 'border-red-400' : 'border-gray-200'
                  }`}
                  disabled={loading}
                />
              )}
              {errors.gameName && <p className="text-[11px] font-semibold text-red-500">{errors.gameName}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-category">Category</label>
              <select
                id="game-category"
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                  errors.category ? 'border-red-400' : 'border-gray-200'
                }`}
                name="category"
                value={addGame.category}
                onChange={handleGame}
                disabled={loading}
              >
                <option value="">Select Category</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="team">Team</option>
              </select>
              {errors.category && <p className="text-[11px] font-semibold text-red-500">{errors.category}</p>}
            </div>

            {/* Game Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-type">Game Type</label>
              <select
                id="game-type"
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                  errors.gameType ? 'border-red-400' : 'border-gray-200'
                }`}
                name="gameType"
                value={addGame.gameType}
                onChange={handleGame}
                disabled={loading}
              >
                <option value="">Select Type</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
              {errors.gameType && <p className="text-[11px] font-semibold text-red-500">{errors.gameType}</p>}
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-duration">Duration</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiClock /></span>
                <input
                  id="game-duration"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.duration ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="text"
                  name="duration"
                  placeholder="e.g. 60 mins, 2 hours"
                  value={addGame.duration}
                  onChange={handleGame}
                  disabled={loading}
                />
              </div>
              {errors.duration && <p className="text-[11px] font-semibold text-red-500">{errors.duration}</p>}
            </div>

            {/* Game Fee */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-fee">Game Fee (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                <input
                  id="game-fee"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.gameFee ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="number"
                  name="gameFee"
                  placeholder="e.g. 1500"
                  value={addGame.gameFee}
                  onChange={handleGame}
                  disabled={loading}
                  min="0"
                />
              </div>
              {errors.gameFee && <p className="text-[11px] font-semibold text-red-500">{errors.gameFee}</p>}
            </div>

            {/* Maximum Capacity */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-capacity">Maximum Capacity</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiUsers /></span>
                <input
                  id="game-capacity"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.maximumCapacity ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="number"
                  name="maximumCapacity"
                  placeholder="e.g. 30 players"
                  value={addGame.maximumCapacity}
                  onChange={handleGame}
                  disabled={loading}
                  min="1"
                />
              </div>
              {errors.maximumCapacity && <p className="text-[11px] font-semibold text-red-500">{errors.maximumCapacity}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-status">Status</label>
              <select
                id="game-status"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                name="status"
                value={addGame.status}
                onChange={handleGame}
                disabled={loading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="game-desc">Description</label>
              <div className="relative flex items-start">
                <span className="absolute left-3 top-3 text-gray-400 text-sm"><FiFileText /></span>
                <textarea
                  id="game-desc"
                  className={`w-full pl-9 pr-4 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-y ${
                    errors.description ? 'border-red-400' : 'border-gray-200'
                  }`}
                  name="description"
                  placeholder="Provide game description details..."
                  value={addGame.description}
                  onChange={handleGame}
                  disabled={loading}
                />
              </div>
              {errors.description && <p className="text-[11px] font-semibold text-red-500">{errors.description}</p>}
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
            <button
              id="game-reset-btn"
              type="button"
              className="px-6 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm font-bold rounded-xl transition-all cursor-pointer text-center"
              onClick={() => {
                setAddGame(INITIAL_STATE);
                setIsOtherSelected(false);
                localStorage.removeItem('gameFormDraft');
                setErrors({});
                fetchNextId();
              }}
              disabled={loading}
            >
              Reset
            </button>
            <button
              id="game-submit-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all disabled:opacity-55 cursor-pointer flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {loading ? 'Saving...' : 'Save Game'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default GameAdd;
