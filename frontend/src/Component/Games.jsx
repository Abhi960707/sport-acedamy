import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { FiAward, FiClock } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

const INITIAL_STATE = {
  gameId: '',
  gameName: '',
  category: '',
  gameType: '',
  duration: '',
  gameFee: '',
};

function GameAdd() {
  const toast = useToast();
  const [addGame, setAddGame] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchNextId = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/games/next-id', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
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

  const validate = () => {
    const tempErrors = {};
    if (!addGame.gameName) tempErrors.gameName = 'Game name is required';
    if (!addGame.category) tempErrors.category = 'Category is required';
    if (!addGame.gameType) tempErrors.gameType = 'Game type is required';
    if (!addGame.duration) tempErrors.duration = 'Duration is required';
    if (!addGame.gameFee) {
      tempErrors.gameFee = 'Game fee is required';
    } else if (Number(addGame.gameFee) < 0) {
      tempErrors.gameFee = 'Game fee cannot be negative';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleGame = (e) => {
    const { name, value } = e.target;
    setAddGame(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const gameSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Please correct the validation errors', 'warning');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/games/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addGame),
      });

      const result = await res.json();
      if (result.success) {
        toast('Game added successfully!', 'success');
        setAddGame(INITIAL_STATE);
        fetchNextId();
      } else {
        toast(result.message || 'Failed to add game', 'error');
      }
    } catch (error) {
      toast('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
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
              <input
                id="game-name"
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.gameName ? 'border-red-400' : 'border-gray-200'
                }`}
                type="text"
                name="gameName"
                placeholder="e.g. Cricket, Football"
                value={addGame.gameName}
                onChange={handleGame}
                disabled={loading}
              />
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

          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
            <button
              id="game-reset-btn"
              type="button"
              className="px-6 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm font-bold rounded-xl transition-all cursor-pointer text-center"
              onClick={() => {
                setAddGame(INITIAL_STATE);
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
