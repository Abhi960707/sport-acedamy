import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import { FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiPhone, FiMail, FiCalendar, FiMapPin } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

export default function PlayerReport({ searchQuery }) {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  // Modal lists
  const [gamesList, setGamesList] = useState([]);
  const [coachesList, setCoachesList] = useState([]);

  // Edit State
  const [editPlayer, setEditPlayer] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Sorting and Pagination State
  const [sortConfig, setSortConfig] = useState({ key: 'playerId', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset pagination to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:4005/players/report', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data.data || []);
      } catch (err) {
        toast('Failed to fetch players report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token, toast]);

  // Load games and coaches for the edit modal
  useEffect(() => {
    const fetchOptionsData = async () => {
      try {
        const [gamesRes, coachesRes] = await Promise.all([
          fetch('http://localhost:4005/games/report', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:4005/coach/report', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const gamesData = await gamesRes.json();
        const coachesData = await coachesRes.json();

        if (gamesData.success) setGamesList(gamesData.data || []);
        if (coachesData.success) setCoachesList(coachesData.data || []);
      } catch (err) {
        console.error('Error fetching edit modal option list:', err);
      }
    };
    if (token) {
      fetchOptionsData();
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    setDeletingId(id);
    try {
      const rem = await fetch(`http://localhost:4005/players/delete/${id}`, {
        method: 'DELETE',
      });
      const emp = await rem.json();
      if (emp.success) {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Player deleted successfully', 'success');
        if (paginatedTasks.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        toast('Failed to delete player', 'error');
      }
    } catch {
      toast('Server error during deletion', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (player) => {
    setEditPlayer({ ...player });
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditPlayer(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'sportChosen') {
        const game = gamesList.find(g => g.gameName === value);
        const gameFee = game ? game.gameFee : '';
        updated.totalFee = gameFee;

        const tf = parseFloat(gameFee) || 0;
        const pf = parseFloat(updated.payingFee) || 0;
        updated.pendingFee = (tf - pf >= 0 ? tf - pf : 0).toString();
      }

      if (name === 'payingFee') {
        const tf = parseFloat(updated.totalFee) || 0;
        const pf = parseFloat(value) || 0;
        updated.pendingFee = (tf - pf >= 0 ? tf - pf : 0).toString();
      }

      return updated;
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!editPlayer.fullName || !editPlayer.dateOfBirth || !editPlayer.gender || !editPlayer.contactNumber || !editPlayer.email || !editPlayer.address || !editPlayer.sportChosen || !editPlayer.coachAssigned || !editPlayer.joiningDate) {
      toast('Please fill in all required fields', 'warning');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(editPlayer.contactNumber)) {
      toast('Contact must be a valid 10-digit number', 'warning');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(editPlayer.email)) {
      toast('Invalid email address format', 'warning');
      return;
    }
    if (editPlayer.contactNumber === editPlayer.email) {
      toast('Contact and Email cannot be identical', 'warning');
      return;
    }

    const tf = parseFloat(editPlayer.totalFee) || 0;
    const pf = parseFloat(editPlayer.payingFee) || 0;
    if (editPlayer.payingFee === '') {
      toast('Paying fee is required', 'warning');
      return;
    }
    if (isNaN(pf) || pf < 0) {
      toast('Paying fee must be a positive number', 'warning');
      return;
    }
    if (pf > tf) {
      toast(`Paying fee (₹${pf}) cannot exceed Total fee (₹${tf})`, 'warning');
      return;
    }

    setUpdateLoading(true);
    try {
      const res = await axios.put(`http://localhost:4005/players/update/${editPlayer._id}`, editPlayer, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        toast('Player registration updated successfully', 'success');
        setTasks(prev => prev.map(t => t._id === editPlayer._id ? res.data.data : t));
        setEditPlayer(null);
      } else {
        toast(res.data.message || 'Failed to update player registration', 'error');
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
    return sortedTasks.filter(s =>
      (s.fullName && s.fullName.toLowerCase().includes(query)) ||
      (s.playerId && s.playerId.toLowerCase().includes(query)) ||
      (s.sportChosen && s.sportChosen.toLowerCase().includes(query)) ||
      (s.coachAssigned && s.coachAssigned.toLowerCase().includes(query)) ||
      (s.contactNumber && s.contactNumber.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.address && s.address.toLowerCase().includes(query)) ||
      (s.totalFee && s.totalFee.toString().includes(query)) ||
      (s.payingFee && s.payingFee.toString().includes(query)) ||
      (s.pendingFee && s.pendingFee.toString().includes(query))
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
            🏃
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Players Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'player' : 'players'} matched
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
            <span className="text-sm font-semibold">Loading player registry...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <span className="text-5xl mb-3">🏃</span>
            <h3 className="text-base font-bold text-gray-700">No Players Enrolled</h3>
            <p className="text-xs max-w-xs mt-1">Try registering a new player or check your search criteria.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            
            {/* Scrollable table wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th 
                      onClick={() => requestSort('playerId')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Player ID {getSortIcon('playerId')}
                    </th>
                    <th 
                      onClick={() => requestSort('fullName')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Full Name {getSortIcon('fullName')}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">DOB</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                    <th 
                      onClick={() => requestSort('sportChosen')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Sport {getSortIcon('sportChosen')}
                    </th>
                    <th 
                      onClick={() => requestSort('coachAssigned')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Coach {getSortIcon('coachAssigned')}
                    </th>
                    <th 
                      onClick={() => requestSort('joiningDate')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Joining {getSortIcon('joiningDate')}
                    </th>
                    <th 
                      onClick={() => requestSort('totalFee')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Total Fee {getSortIcon('totalFee')}
                    </th>
                    <th 
                      onClick={() => requestSort('payingFee')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Paid {getSortIcon('payingFee')}
                    </th>
                    <th 
                      onClick={() => requestSort('pendingFee')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Pending {getSortIcon('pendingFee')}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedTasks.map((player, index) => (
                    <tr 
                      key={player._id} 
                      className={`hover:bg-blue-50/20 transition-colors ${deletingId === player._id ? 'opacity-40' : ''}`}
                    >
                      <td className="px-6 py-3.5 text-gray-400 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-700">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-blue-600 text-xs font-bold font-mono">
                          {player.playerId}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-800">{player.fullName}</td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">{player.dateOfBirth}</td>
                      <td className="px-6 py-3.5 capitalize text-gray-600 font-bold">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${
                          player.gender === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-pink-50 text-pink-700 border border-pink-100'
                        }`}>
                          {player.gender}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <FiPhone className="text-gray-400 text-xs" /> {player.contactNumber}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <FiMail className="text-gray-400 text-xs" /> {player.email}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium truncate max-w-[150px]">{player.address}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                          {player.sportChosen}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-700 font-medium">{player.coachAssigned}</td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar className="text-gray-400 text-xs" /> {player.joiningDate}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-800">₹{player.totalFee}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-600">₹{player.payingFee}</td>
                      <td className="px-6 py-3.5 font-bold">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs ${
                          Number(player.pendingFee) > 0 
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          ₹{player.pendingFee}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(player)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            <FiEdit2 />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(player._id)}
                            disabled={deletingId === player._id}
                            id={`delete-player-${player._id}`}
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

      {/* Edit Player Modal */}
      {editPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 bg-gray-50/75 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Update Player Registration</h3>
              <button onClick={() => setEditPlayer(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold focus:outline-none">&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
              
              {/* Section: Personal Info */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-1">Personal Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Player ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Player ID</label>
                    <input type="text" className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed" value={editPlayer.playerId} disabled />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <input type="text" name="fullName" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editPlayer.fullName} onChange={handleModalChange} required />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">DOB</label>
                    <input type="date" name="dateOfBirth" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer" value={editPlayer.dateOfBirth} onChange={handleModalChange} required />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</label>
                    <select name="gender" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer" value={editPlayer.gender} onChange={handleModalChange} required>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-xs"><FiPhone /></span>
                      <input type="text" name="contactNumber" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editPlayer.contactNumber} onChange={handleModalChange} required />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-xs"><FiMail /></span>
                      <input type="email" name="email" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editPlayer.email} onChange={handleModalChange} required />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-xs"><FiMapPin /></span>
                      <input type="text" name="address" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editPlayer.address} onChange={handleModalChange} required />
                    </div>
                  </div>

                </div>
              </div>

              {/* Section: Academy Info */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-1">Academy Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Sport Chosen */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sport Chosen</label>
                    <select name="sportChosen" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer" value={editPlayer.sportChosen} onChange={handleModalChange} required>
                      <option value="">Select Sport</option>
                      {gamesList.map((g) => (
                        <option key={g._id} value={g.gameName}>{g.gameName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Coach Assigned */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coach Assigned</label>
                    <select name="coachAssigned" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer" value={editPlayer.coachAssigned} onChange={handleModalChange} required>
                      <option value="">Select Coach</option>
                      {coachesList.map((c) => (
                        <option key={c._id} value={c.name}>{c.name} ({c.sportSpecialization})</option>
                      ))}
                    </select>
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joining Date</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-xs"><FiCalendar /></span>
                      <input type="date" name="joiningDate" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer" value={editPlayer.joiningDate} onChange={handleModalChange} required />
                    </div>
                  </div>

                </div>
              </div>

              {/* Section: Fee Info */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-1">Fee Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Total Fee (ReadOnly) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Fee (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                      <input type="text" className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed" value={editPlayer.totalFee} readOnly />
                    </div>
                  </div>

                  {/* Paying Fee */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paying Fee (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                      <input type="number" name="payingFee" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editPlayer.payingFee} onChange={handleModalChange} min="0" required />
                    </div>
                  </div>

                  {/* Pending Fee (ReadOnly) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Fee (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                      <input type="text" className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed" value={editPlayer.pendingFee} readOnly />
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditPlayer(null)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition">Cancel</button>
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
