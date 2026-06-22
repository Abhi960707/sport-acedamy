import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import { FiAward, FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiClock } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

export default function GameReport({ searchQuery }) {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  // Edit State
  const [editGame, setEditGame] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Sorting and Pagination State
  const [sortConfig, setSortConfig] = useState({ key: 'gameId', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset pagination to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:4005/games/report', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data.data || []);
      } catch (err) {
        toast('Failed to fetch games report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token, toast]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    setDeletingId(id);
    try {
      const rem = await fetch(`http://localhost:4005/games/delete/${id}`, {
        method: 'DELETE',
      });
      const emp = await rem.json();
      if (emp.success) {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Game deleted successfully', 'success');
        if (paginatedTasks.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        toast('Failed to delete game', 'error');
      }
    } catch {
      toast('Server error during deletion', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (game) => {
    setEditGame({ ...game });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editGame.gameName || !editGame.category || !editGame.gameType || !editGame.duration || !editGame.gameFee) {
      toast('All fields are required', 'warning');
      return;
    }
    if (Number(editGame.gameFee) < 0) {
      toast('Fee cannot be negative', 'warning');
      return;
    }

    setUpdateLoading(true);
    try {
      const res = await axios.put(`http://localhost:4005/games/update/${editGame._id}`, editGame, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        toast('Game details updated successfully', 'success');
        setTasks(prev => prev.map(t => t._id === editGame._id ? res.data.data : t));
        setEditGame(null);
      } else {
        toast(res.data.message || 'Failed to update game details', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error during update', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Sort Logic
  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] !== undefined ? a[sortConfig.key] : '';
        const valB = b[sortConfig.key] !== undefined ? b[sortConfig.key] : '';
        
        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        return sortConfig.direction === 'asc'
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      });
    }
    return sortableItems;
  }, [tasks, sortConfig]);

  // Filter Logic
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return sortedTasks;
    const query = searchQuery.toLowerCase().trim();
    return sortedTasks.filter(p =>
      (p.gameName && p.gameName.toLowerCase().includes(query)) ||
      (p.gameId && p.gameId.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.gameType && p.gameType.toLowerCase().includes(query)) ||
      (p.duration && p.duration.toLowerCase().includes(query)) ||
      (p.gameFee && p.gameFee.toString().includes(query))
    );
  }, [sortedTasks, searchQuery]);

  // Pagination Logic
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />;
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
            <FiAward />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Games Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'game' : 'games'} matched
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
            <span className="text-sm font-semibold">Loading game catalog...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <span className="text-5xl mb-3">🎮</span>
            <h3 className="text-base font-bold text-gray-700">No Games Registered</h3>
            <p className="text-xs max-w-xs mt-1">Try creating a new sport game or check your search criteria.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            
            {/* Table wrapper for horizontal scroll */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th 
                      onClick={() => requestSort('gameId')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Game ID {getSortIcon('gameId')}
                    </th>
                    <th 
                      onClick={() => requestSort('gameName')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Game Name {getSortIcon('gameName')}
                    </th>
                    <th 
                      onClick={() => requestSort('category')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Category {getSortIcon('category')}
                    </th>
                    <th 
                      onClick={() => requestSort('gameType')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Type {getSortIcon('gameType')}
                    </th>
                    <th 
                      onClick={() => requestSort('duration')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Duration {getSortIcon('duration')}
                    </th>
                    <th 
                      onClick={() => requestSort('gameFee')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Fee (₹) {getSortIcon('gameFee')}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedTasks.map((game, index) => (
                    <tr 
                      key={game._id} 
                      className={`hover:bg-blue-50/20 transition-colors ${deletingId === game._id ? 'opacity-40' : ''}`}
                    >
                      <td className="px-6 py-3.5 text-gray-400 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-700">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-blue-600 text-xs font-bold font-mono">
                          {game.gameId}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-800">{game.gameName}</td>
                      <td className="px-6 py-3.5 capitalize text-gray-600">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          game.category === 'single' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                          game.category === 'double' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {game.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 capitalize text-gray-600">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          game.gameType === 'indoor' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {game.gameType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">{game.duration}</td>
                      <td className="px-6 py-3.5 font-bold text-blue-600">₹{game.gameFee}</td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEditClick(game)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            <FiEdit2 />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(game._id)}
                            disabled={deletingId === game._id}
                            id={`delete-game-${game._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <FiTrash2 />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-gray-50/50 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold">
                  Showing page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 border border-gray-200 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <FiChevronLeft className="text-base" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'border border-transparent hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 border border-gray-200 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <FiChevronRight className="text-base" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Edit Game Modal */}
      {editGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 bg-gray-50/75 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Update Game Details</h3>
              <button onClick={() => setEditGame(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold focus:outline-none">&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Game ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Game ID</label>
                  <input type="text" className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed" value={editGame.gameId} disabled />
                </div>

                {/* Game Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Game Name</label>
                  <input type="text" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editGame.gameName} onChange={(e) => setEditGame({...editGame, gameName: e.target.value})} required />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editGame.category} onChange={(e) => setEditGame({...editGame, category: e.target.value})} required>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="team">Team</option>
                  </select>
                </div>

                {/* Game Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Game Type</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editGame.gameType} onChange={(e) => setEditGame({...editGame, gameType: e.target.value})} required>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-400 text-sm"><FiClock /></span>
                    <input type="text" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editGame.duration} onChange={(e) => setEditGame({...editGame, duration: e.target.value})} required />
                  </div>
                </div>

                {/* Game Fee */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Game Fee (₹)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                    <input type="number" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editGame.gameFee} onChange={(e) => setEditGame({...editGame, gameFee: e.target.value})} min="0" required />
                  </div>
                </div>

              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditGame(null)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition">Cancel</button>
                <button type="submit" disabled={updateLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                  {updateLoading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
