import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api, { API_BASE } from '../../api';
import { useToast } from '../../common/Toast';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiPhone, FiMail, FiCalendar, FiMapPin, FiBell, FiPrinter, FiUser } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { canManageAcademyRecords, canEditPlayer } from '../../common/access';
import ExportDropdown from './ExportDropdown';
import { downloadCsv, downloadPdf } from '../../common/reportExport';
import PlayerRegistrationPrint from './PlayerRegistrationPrint';
import PlayerIdCardModal from './PlayerIdCardModal';
import PlayerIdCardPrint from './PlayerIdCardPrint';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  if (url.includes('/uploads/')){
    const filename = url.split('/uploads/')[1];
    return `${API_BASE}/uploads/${filename}`;
  }
  return url;
};

export default function PlayerReport({ searchQuery }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('sa_token');

  // Modal lists
  const [gamesList, setGamesList] = useState([]);
  const [coachesList, setCoachesList] = useState([]);

  // Edit State
  const [editPlayer, setEditPlayer] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // Leave Academy & Summary state
  const [playerSummary, setPlayerSummary] = useState(null);
  const [leaveAcademyChecked, setLeaveAcademyChecked] = useState(false);
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRemarks, setLeaveRemarks] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!editPlayer || !editPlayer._id) return;
      try {
        const res = await api.get(`/players/summary/${editPlayer._id}`);
        if (res.data.success) {
          setPlayerSummary(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch player summary:', err);
      }
    };
    fetchSummary();
  }, [editPlayer]);

  useEffect(() => {
    if (editPlayer) {
      setLeaveAcademyChecked(editPlayer.status === 'Left Academy');
      if (playerSummary && playerSummary.archive) {
        setLeaveDate(playerSummary.archive.leavingDate || new Date().toISOString().split('T')[0]);
        setLeaveReason(playerSummary.archive.reasonForLeaving || '');
        setLeaveRemarks(playerSummary.archive.remarks || '');
      } else {
        setLeaveDate(new Date().toISOString().split('T')[0]);
        setLeaveReason('');
        setLeaveRemarks('');
      }
    } else {
      setLeaveAcademyChecked(false);
      setLeaveReason('');
      setLeaveRemarks('');
      setPlayerSummary(null);
    }
  }, [editPlayer, playerSummary]);

  const handleLeaveAcademySubmit = async () => {
    if (!leaveDate || !leaveReason) {
      toast('Leaving Date and Reason are required', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to mark ${editPlayer.fullName} as Left Academy?`)) {
      return;
    }

    setLeaveLoading(true);
    try {
      const res = await api.put(`/players/leave/${editPlayer._id}`, {
        leavingDate: leaveDate,
        reasonForLeaving: leaveReason,
        remarks: leaveRemarks
      });

      if (res.data.success) {
        toast('Player status changed to Left Academy successfully', 'success');
        setTasks(prev => prev.map(t => t._id === editPlayer._id ? { ...t, status: 'Left Academy' } : t));
        
        // Fetch updated player summary so print contains archive/leave info
        try {
          const summaryRes = await api.get(`/players/summary/${editPlayer._id}`);
          if (summaryRes.data.success) {
            setPlayerSummary(summaryRes.data.data);
          }
        } catch (summaryErr) {
          console.error('Failed to load updated summary for print:', summaryErr);
        }

        // Log print event
        try {
          await api.post('/players/print-history', { playerId: editPlayer._id, reason: 'Exit Registration Form Print' });
        } catch (printErr) {
          console.error('Failed to log print history:', printErr);
        }

        // Print form
        const printPayload = {
          ...editPlayer,
          status: 'Left Academy',
          sportChosen: editPlayer.gameCategory && editPlayer.gameType 
            ? `${editPlayer.sportChosen} (${editPlayer.gameCategory} - ${editPlayer.gameType})`
            : editPlayer.sportChosen
        };
        setPrintPlayer(printPayload);

        setTimeout(() => {
          window.print();
          setEditPlayer(null);
        }, 400);

      } else {
        toast(res.data.message || 'Failed to update exit details', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error during exit update', 'error');
    } finally {
      setLeaveLoading(false);
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
          setEditPlayer(prev => ({ ...prev, playerImage: res.data.url }));
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

  const calculatedAge = useMemo(() => {
    if (!editPlayer || !editPlayer.dateOfBirth) return '';
    const dob = new Date(editPlayer.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : '';
  }, [editPlayer]);

  const [printPlayer, setPrintPlayer] = useState(null);
  const [academySettings, setAcademySettings] = useState(null);
  const [idCardPlayer, setIdCardPlayer] = useState(null);
  const [idCardPrintPlayer, setIdCardPrintPlayer] = useState(null);

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
    if (token) {
      fetchAcademySettings();
    }
  }, [token]);

  const handlePrintClick = (player) => {
    handleEditClick(player);
  };

  // Sorting and Pagination State
  const [sortConfig, setSortConfig] = useState({ key: 'playerId', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [isPrinting, setIsPrinting] = useState(false);
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);
  const canManageRecords = canManageAcademyRecords();
  const canEdit = canEditPlayer();

  // Reset pagination to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get('/players/report');
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
          api.get('/games/report'),
          api.get('/coach/report'),
        ]);
        if (gamesRes.data.success) setGamesList(gamesRes.data.data || []);
        if (coachesRes.data.success) setCoachesList(coachesRes.data.data || []);
      } catch (err) {
        console.error('Error fetching edit modal option list:', err);
      }
    };
    if (token) {
      fetchOptionsData();
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!canManageRecords) {
      toast('You do not have permission to delete player records', 'warning');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    setDeletingId(id);
    try {
      const rem = await api.delete(`/players/delete/${id}`);
      if (rem.data.success) {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Player deleted successfully', 'success');
        if (paginatedTasks.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        toast(rem.data.message || 'Failed to delete player', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error during deletion', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (player) => {
    let baseSport = player.sportChosen || '';
    let category = '';
    let type = '';
    const match = player.sportChosen?.match(/(.*?)\s*\((.*?)\s*-\s*(.*?)\)/);
    if (match) {
      baseSport = match[1].trim();
      category = match[2].trim();
      type = match[3].trim();
    } else {
      baseSport = player.sportChosen;
    }
    setEditPlayer({ 
      ...player,
      sportChosen: baseSport,
      gameCategory: category,
      gameType: type
    });
  };

  const handleModalChange = (e) => {
    let { name, value } = e.target;
    if (name === 'contactNumber' || name === 'emergencyContact') {
      value = value.replace(/\D/g, '');
    }
    setEditPlayer(prev => {
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
    if (!canEdit) {
      toast('You do not have permission to update player records', 'warning');
      return;
    }
    
    // Validations
    if (!editPlayer.fullName || !editPlayer.dateOfBirth || !editPlayer.gender || !editPlayer.contactNumber || !editPlayer.email || !editPlayer.address || !editPlayer.sportChosen || !editPlayer.coachAssigned || !editPlayer.joiningDate) {
      toast('Please fill in all required fields', 'warning');
      return;
    }
    if (!/^\d{10}$/.test(editPlayer.contactNumber)) {
      toast('Contact must be a valid 10-digit number', 'warning');
      return;
    }
    if (editPlayer.emergencyContact && !/^\d{10}$/.test(editPlayer.emergencyContact)) {
      toast('Emergency Contact must be a valid 10-digit number', 'warning');
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
    if (editPlayer.sportChosen && (!editPlayer.gameCategory || !editPlayer.gameType)) {
      toast('Please select a game category and type', 'warning');
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

    const submitPayload = {
      ...editPlayer,
      sportChosen: editPlayer.gameCategory && editPlayer.gameType 
        ? `${editPlayer.sportChosen} (${editPlayer.gameCategory} - ${editPlayer.gameType})`
        : editPlayer.sportChosen
    };
    delete submitPayload.gameCategory;
    delete submitPayload.gameType;

    setUpdateLoading(true);
    try {
      const res = await api.put(`/players/update/${editPlayer._id}`, submitPayload);

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
      (s.pendingFee && s.pendingFee.toString().includes(query)) ||
      (query === 'pending' && Number(s.pendingFee) > 0)
    );
  }, [sortedTasks, searchQuery]);

  // Pagination Logic
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [filteredTasks.length, currentPage]);

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

  const reportColumns = [
    { label: 'Player ID', value: 'playerId' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Date of Birth', value: 'dateOfBirth' },
    { label: 'Gender', value: 'gender' },
    { label: 'Contact Number', value: 'contactNumber' },
    { label: 'Email', value: 'email' },
    { label: 'Sport Chosen', value: 'sportChosen' },
    { label: 'Coach Assigned', value: 'coachAssigned' },
    { label: 'Joining Date', value: 'joiningDate' },
    { label: 'Total Fee', value: 'totalFee' },
    { label: 'Paying Fee', value: 'payingFee' },
    { label: 'Pending Fee', value: 'pendingFee' },
  ];

  const handleExportCsv = () => {
    if (!filteredTasks.length) {
      toast('No player records available to export', 'warning');
      return;
    }
    downloadCsv('players-report.csv', reportColumns, filteredTasks);
    toast('Player report exported as CSV', 'success');
  };

  const handleExportPdf = () => {
    if (!filteredTasks.length) {
      toast('No player records available to export', 'warning');
      return;
    }
    downloadPdf('players-report.pdf', reportColumns, filteredTasks, 'Players Report');
    toast('Player report exported as PDF', 'success');
  };

  const handleNotifyCoaches = async () => {
    const pendingPlayers = filteredTasks.filter(p => Number(p.pendingFee) > 0);
    if (pendingPlayers.length === 0) {
      toast('No players with pending fees to notify', 'warning');
      return;
    }

    // Group by coach
    const byCoach = {};
    pendingPlayers.forEach(p => {
      const coach = p.coachAssigned || 'Unassigned';
      if (!byCoach[coach]) byCoach[coach] = [];
      byCoach[coach].push(p);
    });

    const notifications = Object.keys(byCoach).map(coachName => {
      const playersList = byCoach[coachName];
      const playerDetails = playersList.map(p => `${p.fullName} (₹${p.pendingFee})`).join(', ');
      return {
        coachName,
        message: `The following players have pending fees: ${playerDetails}`
      };
    });

    setNotifying(true);
    try {
      const res = await api.post('/notifications/notify-coaches', { notifications });
      if (res.data.success) {
        toast('Coaches notified successfully', 'success');
      } else {
        toast(res.data.message || 'Failed to notify coaches', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error during notification', 'error');
    } finally {
      setNotifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isSearchActive = Boolean(searchQuery && searchQuery.trim());

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

        <div className="flex items-center gap-3">
          {canManageRecords && filteredTasks.some(p => Number(p.pendingFee) > 0) && (
            <button type="button"
              onClick={handleNotifyCoaches}
              disabled={notifying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
            >
              {notifying ? <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <FiBell />}
              Notify Coaches
            </button>
          )}
          <ExportDropdown
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onPrint={handlePrint}
            showPrint={true}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
            <span className="text-sm font-semibold">Loading player registry...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 gap-4">
            <span className="text-5xl mb-1">🏃</span>
            <div>
              <h3 className="text-base font-bold text-gray-700">No Players Enrolled</h3>
              <p className="text-xs max-w-xs mt-1">Try registering a new player or check your search criteria.</p>
            </div>
            {canManageRecords && (
              <button 
                type="button"
                onClick={() => navigate('/player')} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                Add Player First
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="md:hidden print:hidden print:grid-cols-2 print:gap-4 space-y-2 print:space-y-0 p-3 print:p-0">
              {(isPrinting ? filteredTasks : paginatedTasks).map((player, index) => (
                <article
                  key={player._id}
                  className={`rounded-xl border border-gray-100 bg-white shadow-sm p-3 space-y-3 ${deletingId === player._id ? 'opacity-40' : ''} ${isSearchActive ? 'ring-1 ring-blue-100 bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Player #{(currentPage - 1) * itemsPerPage + index + 1}</div>
                      <h3 className="text-sm font-bold text-gray-800 truncate">{player.fullName}</h3>
                      <div className="inline-flex px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md text-blue-600 text-[11px] font-bold font-mono w-fit mt-1">
                        {player.playerId}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      Number(player.pendingFee) > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      ₹{player.pendingFee}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">DOB</span>
                      <span className="text-gray-700 font-medium">{player.dateOfBirth}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Gender</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${player.gender === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'}`}>
                        {player.gender}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Contact</span>
                      <span className="text-gray-700 font-medium text-right">{player.contactNumber}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Email</span>
                      <span className="text-gray-700 font-medium text-right break-all">{player.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Sport</span>
                      <span className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">{player.sportChosen}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Coach</span>
                      <span className="text-gray-700 font-medium text-right">{player.coachAssigned}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Joining</span>
                      <span className="text-gray-700 font-medium text-right">{player.joiningDate}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-400 font-semibold">Total / Paid</span>
                      <span className="text-gray-700 font-medium text-right">₹{player.totalFee} / ₹{player.payingFee}</span>
                    </div>
                    <div className="text-gray-700 font-medium leading-tight">
                      <span className="text-gray-400 font-semibold mr-2">Address</span>
                      <span className="block mt-0.5 break-words">{player.address}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button"
                      onClick={() => handlePrintClick(player)}
                      className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-3 text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-800 hover:text-white rounded-xl transition-all cursor-pointer min-h-11"
                    >
                      <FiPrinter />
                      <span>Print</span>
                    </button>
                    <button type="button"
                      onClick={() => setIdCardPlayer(player)}
                      className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-3 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-600 hover:text-white rounded-xl transition-all cursor-pointer min-h-11"
                    >
                      <span className="text-base">🪪</span>
                      <span>ID Card</span>
                    </button>
                    {canEdit && (
                      <button type="button"
                        onClick={() => handleEditClick(player)}
                        className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-3 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer min-h-11"
                      >
                        <FiEdit2 />
                        <span>Edit</span>
                      </button>
                    )}
                    {canManageRecords && (
                      <button type="button"
                        onClick={() => handleDelete(player._id)}
                        disabled={deletingId === player._id}
                        id={`delete-player-${player._id}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer min-h-11"
                      >
                        <FiTrash2 />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block print:block overflow-x-auto print:w-full print:overflow-visible print:overflow-x-visible">
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(isPrinting ? filteredTasks : paginatedTasks).map((player, index) => (
                    <tr 
                      key={player._id} 
                      className={`hover:bg-blue-50/20 transition-colors ${deletingId === player._id ? 'opacity-40' : ''} ${isSearchActive ? 'bg-blue-50/20' : ''}`}
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
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          player.status === 'Left Academy' ? 'bg-red-50 text-red-700 border-red-100' :
                          player.status === 'Active' || !player.status ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {player.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button"
                            onClick={() => handlePrintClick(player)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-800 hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            <FiPrinter />
                            <span>Details / Print</span>
                          </button>
                          <button type="button"
                            onClick={() => setIdCardPlayer(player)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-600 hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            <span className="text-sm">🪪</span>
                            <span>ID Card</span>
                          </button>
                          {canEdit && (
                            <button type="button"
                              onClick={() => handleEditClick(player)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer"
                            >
                              <FiEdit2 />
                              <span>Edit</span>
                            </button>
                          )}
                          {canManageRecords && (
                            <button type="button"
                              onClick={() => handleDelete(player._id)}
                              disabled={deletingId === player._id}
                              id={`delete-player-${player._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <FiTrash2 />
                              <span>Delete</span>
                            </button>
                          )}
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
                <div className="flex items-center gap-1.5">
                  <button type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2.5 py-1.5 border border-gray-200 hover:bg-white text-gray-600 text-[10px] font-bold rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    First
                  </button>
                  <button type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 border border-gray-200 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <FiChevronLeft className="text-base" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button type="button"
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
                  <button type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 border border-gray-200 hover:bg-white text-gray-600 rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <FiChevronRight className="text-base" />
                  </button>
                  <button type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2.5 py-1.5 border border-gray-200 hover:bg-white text-gray-600 text-[10px] font-bold rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Edit Player Modal */}
      {editPlayer && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden print:overflow-visible print:border-none print:shadow-none animate-fade-in-up">
            <div className="px-6 py-5 bg-gray-50/75 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Update Player Registration</h3>
              <button type="button" onClick={() => setEditPlayer(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold focus:outline-none">&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 sm:p-8 space-y-8 h-[80vh] overflow-y-auto" noValidate>
              
              {/* Section: Personal Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Player Image Upload */}
                  <div className="space-y-1 sm:col-span-2 flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 mb-2">
                    <div className="w-16 h-16 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                      {editPlayer.playerImage ? (
                        <img src={getImageUrl(editPlayer.playerImage)} alt="Player Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-600 uppercase">Player Photo</div>
                      {canEdit && (
                        <div className="flex gap-2">
                          <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                            <span>Upload Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                          {editPlayer.playerImage && (
                            <button
                              type="button"
                              onClick={() => setEditPlayer(prev => ({ ...prev, playerImage: '' }))}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Player ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Player ID</label>
                    <input type="text" className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed" value={editPlayer.playerId} disabled />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Full Name</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FiUser /></span>
                      <input type="text" name="fullName" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editPlayer.fullName} onChange={handleModalChange} disabled={!canEdit || updateLoading} required />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Date of Birth</label>
                    <input type="date" name="dateOfBirth" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.dateOfBirth} onChange={handleModalChange} max={new Date().toISOString().split('T')[0]} disabled={!canEdit || updateLoading} required />
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Age</label>
                    <input type="text" className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed" value={calculatedAge === '' ? '' : `${calculatedAge} years`} readOnly />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Gender</label>
                    <select name="gender" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.gender} onChange={handleModalChange} disabled={!canEdit || updateLoading} required>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Contact Number</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FiPhone /></span>
                      <input type="text" name="contactNumber" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editPlayer.contactNumber} onChange={handleModalChange} maxLength={10} disabled={!canEdit || updateLoading} required />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Emergency Contact</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FiPhone /></span>
                      <input type="text" name="emergencyContact" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editPlayer.emergencyContact || ''} onChange={handleModalChange} maxLength={10} disabled={!canEdit || updateLoading} />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email Address</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FiMail /></span>
                      <input type="email" name="email" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editPlayer.email} onChange={handleModalChange} disabled={!canEdit || updateLoading} required />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Address</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FiMapPin /></span>
                      <input type="text" name="address" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editPlayer.address} onChange={handleModalChange} disabled={!canEdit || updateLoading} required />
                    </div>
                  </div>

                </div>
              </div>

              {/* Section: Academy Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Academy Registration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Sport Chosen */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sport Chosen</label>
                    <select name="sportChosen" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.sportChosen} onChange={handleModalChange} disabled={!canEdit || updateLoading} required>
                      <option value="">Select Sport</option>
                      {[...new Set(gamesList.map((g) => g.gameName))].map((gameName, idx) => (
                        <option key={idx} value={gameName}>{gameName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Game Category */}
                  {editPlayer.sportChosen && (
                  <div className="space-y-1 animate-fade-in-up">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Category</label>
                    <select name="gameCategory" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.gameCategory} onChange={handleModalChange} disabled={!canEdit || updateLoading} required>
                      <option value="">Select Category</option>
                      {[...new Set(gamesList.filter(g => g.gameName === editPlayer.sportChosen).map(g => g.category))].map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* Game Type */}
                  {editPlayer.gameCategory && (
                  <div className="space-y-1 animate-fade-in-up">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Game Type</label>
                    <select name="gameType" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.gameType} onChange={handleModalChange} disabled={!canEdit || updateLoading} required>
                      <option value="">Select Type</option>
                      {[...new Set(gamesList.filter(g => g.gameName === editPlayer.sportChosen && g.category === editPlayer.gameCategory).map(g => g.gameType))].map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* Coach Assigned */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Coach Assigned</label>
                    <select name="coachAssigned" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.coachAssigned} onChange={handleModalChange} disabled={!canEdit || updateLoading} required>
                      <option value="">Select Coach</option>
                      {(() => {
                        if (!editPlayer.sportChosen) return coachesList;
                        const baseSport = editPlayer.sportChosen;
                        const specialized = coachesList.filter(c => c.sportSpecialization === baseSport);
                        const others = coachesList.filter(c => c.sportSpecialization !== baseSport);
                        return [...specialized, ...others];
                      })().map((c) => (
                        <option key={c._id} value={c.name}>{c.name} ({c.sportSpecialization})</option>
                      ))}
                    </select>
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Joining Date</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FiCalendar /></span>
                      <input type="date" name="joiningDate" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={editPlayer.joiningDate} onChange={handleModalChange} max={new Date().toISOString().split('T')[0]} disabled={!canEdit || updateLoading} required />
                    </div>
                  </div>

                </div>
              </div>

              {/* Section: Fee Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Fee Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Total Fee (ReadOnly) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Fee (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                      <input type="text" className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed" value={editPlayer.totalFee} readOnly />
                    </div>
                  </div>

                  {/* Paying Fee */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Paying Fee (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                      <input type="number" name="payingFee" className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editPlayer.payingFee} onChange={handleModalChange} min="0" step="1" disabled={!canEdit || updateLoading} required />
                    </div>
                  </div>

                  {/* Pending Fee (ReadOnly) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Pending Fee (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 text-sm"><FaRupeeSign /></span>
                      <input type="text" className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed" value={editPlayer.pendingFee} readOnly />
                    </div>
                  </div>

                </div>
              </div>

              {/* Section: Leave Academy (Exit Management) */}
              {canManageRecords && (
                <div className="space-y-4 pt-4 border-t border-gray-150">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="leaveAcademyCheckbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      checked={leaveAcademyChecked}
                      onChange={(e) => setLeaveAcademyChecked(e.target.checked)}
                      disabled={editPlayer.status === 'Left Academy'}
                    />
                    <label htmlFor="leaveAcademyCheckbox" className="text-sm font-bold text-gray-700 cursor-pointer">
                      Leave Academy (Exit Management)
                    </label>
                  </div>

                  {leaveAcademyChecked && (
                    <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl space-y-4 animate-fade-in-up">
                      <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">Leave Details for {editPlayer.fullName}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Leaving Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
                            value={leaveDate}
                            onChange={(e) => setLeaveDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            disabled={editPlayer.status === 'Left Academy'}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Reason for Leaving</label>
                          <select
                            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            disabled={editPlayer.status === 'Left Academy'}
                          >
                            <option value="">Select Reason</option>
                            <option value="Resigned">Resigned</option>
                            <option value="Completed Training">Completed Training</option>
                            <option value="Financial Issues">Financial Issues</option>
                            <option value="Transferred">Transferred</option>
                            <option value="Medical">Medical</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Remarks</label>
                          <textarea
                            className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            rows="2"
                            placeholder="Exit remarks / feedback..."
                            value={leaveRemarks}
                            onChange={(e) => setLeaveRemarks(e.target.value)}
                            disabled={editPlayer.status === 'Left Academy'}
                          />
                        </div>
                      </div>

                      {editPlayer.status !== 'Left Academy' && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            disabled={leaveLoading}
                            onClick={handleLeaveAcademySubmit}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-500/10"
                          >
                            {leaveLoading && <span className="animate-spin inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full" />}
                            Confirm Exit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={async () => {
                    const submitPayload = {
                      ...editPlayer,
                      sportChosen: editPlayer.gameCategory && editPlayer.gameType 
                        ? `${editPlayer.sportChosen} (${editPlayer.gameCategory} - ${editPlayer.gameType})`
                        : editPlayer.sportChosen
                    };
                    delete submitPayload.gameCategory;
                    delete submitPayload.gameType;

                    try {
                      await api.post('/players/print-history', { playerId: editPlayer._id, reason: 'Registration Form Print' });
                    } catch (err) {
                      console.error('Failed to log print history:', err);
                    }

                    setPrintPlayer(submitPayload);
                    setTimeout(() => {
                      window.print();
                    }, 300);
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-black text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer mr-auto"
                >
                  <FiPrinter />
                  <span>Print Registration Form</span>
                </button>
                
                <button type="button" onClick={() => setEditPlayer(null)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition">Cancel</button>
                {canEdit && editPlayer.status !== 'Left Academy' && (
                  <button type="submit" disabled={updateLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                    {updateLoading && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full" />}
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {idCardPlayer && (
        <PlayerIdCardModal
          player={idCardPlayer}
          academy={academySettings}
          onClose={() => setIdCardPlayer(null)}
          onPrint={(p) => {
            setIdCardPrintPlayer(p);
            setTimeout(() => {
              document.body.classList.add('printing-id-card');
              const cleanup = () => {
                document.body.classList.remove('printing-id-card');
                window.removeEventListener('afterprint', cleanup);
              };
              window.addEventListener('afterprint', cleanup);
              window.print();
            }, 400);
          }}
        />
      )}

      {printPlayer && (
        <PlayerRegistrationPrint player={printPlayer} academy={academySettings} summary={playerSummary} />
      )}

      {idCardPrintPlayer && (
        <PlayerIdCardPrint player={idCardPrintPlayer} academy={academySettings} />
      )}

    </div>
  );
}
