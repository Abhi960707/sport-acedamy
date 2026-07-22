import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { useToast } from '../../common/Toast';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiPhone, FiAward } from 'react-icons/fi';
import { canManageAcademyRecords } from '../../common/access';
import ExportDropdown from './ExportDropdown';
import { downloadCsv, downloadPdf } from '../../common/reportExport';

const PREDEFINED_SPORTS = [
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


export default function CoachReport({ searchQuery }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  // Edit State
  const [editCoach, setEditCoach] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Sorting and Pagination State
  const [sortConfig, setSortConfig] = useState({ key: 'coachId', direction: 'asc' });
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

  // Reset pagination on search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get('/coach/report');
        setTasks(res.data.data || []);
      } catch (err) {
        toast('Failed to fetch coach report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token, toast]);

  const handleDelete = async (id) => {
    if (!canManageRecords) {
      toast('You do not have permission to delete coach records', 'warning');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this coach?')) return;
    setDeletingId(id);
    try {
      const res = await api.delete(`/coach/delete/${id}`);
      if (res.data.success) {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Coach deleted successfully', 'success');
        if (paginatedTasks.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        toast('Failed to delete coach', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Server error during deletion', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (coach) => {
    if (!canManageRecords) {
      toast('You do not have permission to edit coach records', 'warning');
      return;
    }
    const isCustom = coach.sportSpecialization && !PREDEFINED_SPORTS.includes(coach.sportSpecialization);
    setEditCoach({
      ...coach,
      isOtherSelected: isCustom,
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!canManageRecords) {
      toast('You do not have permission to update coach records', 'warning');
      return;
    }
    if (!editCoach.name || !editCoach.sportSpecialization || !editCoach.contact || !editCoach.experience) {
      toast('All fields are required', 'warning');
      return;
    }
    if (!/^\d{10}$/.test(editCoach.contact)) {
      toast('Contact must be a valid 10-digit number', 'warning');
      return;
    }

    setUpdateLoading(true);
    try {
      const { isOtherSelected, ...updateData } = editCoach;
      const res = await api.put(`/coach/update/${editCoach._id}`, updateData);

      if (res.data.success) {
        toast('Coach details updated successfully', 'success');
        setTasks(prev => prev.map(t => t._id === editCoach._id ? res.data.data : t));
        setEditCoach(null);
      } else {
        toast(res.data.message || 'Failed to update coach details', 'error');
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
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.coachId && p.coachId.toLowerCase().includes(query)) ||
      (p.sportSpecialization && p.sportSpecialization.toLowerCase().includes(query)) ||
      (p.contact && p.contact.toLowerCase().includes(query)) ||
      (p.experience && p.experience.toLowerCase().includes(query))
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
    { label: 'Coach ID', value: 'coachId' },
    { label: 'Full Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Sport Specialization', value: 'sportSpecialization' },
    { label: 'Contact', value: 'contact' },
    { label: 'Experience', value: 'experience' },
  ];

  const handleExportCsv = () => {
    if (!filteredTasks.length) {
      toast('No coach records available to export', 'warning');
      return;
    }
    downloadCsv('coaches-report.csv', reportColumns, filteredTasks);
    toast('Coach report exported as CSV', 'success');
  };

  const handleExportPdf = () => {
    if (!filteredTasks.length) {
      toast('No coach records available to export', 'warning');
      return;
    }
    downloadPdf('coaches-report.pdf', reportColumns, filteredTasks, 'Coach Report');
    toast('Coach report exported as PDF', 'success');
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
            <FiUsers />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Coach Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'coach' : 'coaches'} matched
            </p>
          </div>
        </div>

        <ExportDropdown
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          showPrint={true}
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
            <span className="text-sm font-semibold">Loading coach registry...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 gap-4">
            <span className="text-5xl mb-1">👤</span>
            <div>
              <h3 className="text-base font-bold text-gray-700">No Coaches Registered</h3>
              <p className="text-xs max-w-xs mt-1">Try registering a new coach or check your search criteria.</p>
            </div>
            {canManageRecords && (
              <button 
                type="button"
                onClick={() => navigate('/coach')} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                Add Coach First
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="md:hidden print:hidden space-y-3 p-4">
              {(isPrinting ? filteredTasks : paginatedTasks).map((coach, index) => (
                <article
                  key={coach._id}
                  className={`rounded-2xl border border-gray-100 bg-white shadow-sm p-4 space-y-4 ${deletingId === coach._id ? 'opacity-40' : ''} ${isSearchActive ? 'ring-1 ring-blue-100 bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Coach #{(currentPage - 1) * itemsPerPage + index + 1}</div>
                      <h3 className="text-base font-bold text-gray-800 truncate">{coach.name}</h3>
                      <div className="inline-flex px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-blue-600 text-xs font-bold font-mono w-fit">
                        {coach.coachId}
                      </div>
                    </div>
                    <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                      {coach.sportSpecialization}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-400 font-semibold">Email</span>
                      <span className="text-gray-700 font-medium text-right break-all">{coach.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-400 font-semibold">Contact</span>
                      <span className="text-gray-700 font-medium text-right">{coach.contact}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-400 font-semibold">Experience</span>
                      <span className="text-gray-700 font-medium text-right">{coach.experience}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button"
                      onClick={() => handleEditClick(coach)}
                      className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-3 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer min-h-11"
                    >
                      <FiEdit2 />
                      <span>Edit</span>
                    </button>
                    <button type="button"
                      onClick={() => handleDelete(coach._id)}
                      disabled={deletingId === coach._id}
                      id={`delete-coach-${coach._id}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer min-h-11"
                    >
                      <FiTrash2 />
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block print:block overflow-x-auto print:w-full print:overflow-visible print:overflow-x-visible">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th 
                      onClick={() => requestSort('coachId')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Coach ID {getSortIcon('coachId')}
                    </th>
                    <th 
                      onClick={() => requestSort('name')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Full Name {getSortIcon('name')}
                    </th>
                    <th 
                      onClick={() => requestSort('email')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Email {getSortIcon('email')}
                    </th>
                    <th 
                      onClick={() => requestSort('sportSpecialization')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Sport Specialization {getSortIcon('sportSpecialization')}
                    </th>
                    <th 
                      onClick={() => requestSort('contact')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Contact {getSortIcon('contact')}
                    </th>
                    <th 
                      onClick={() => requestSort('experience')} 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 select-none"
                    >
                      Experience {getSortIcon('experience')}
                    </th>
                    {canManageRecords && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(isPrinting ? filteredTasks : paginatedTasks).map((coach, index) => (
                    <tr 
                      key={coach._id} 
                      className={`hover:bg-blue-50/20 transition-colors ${deletingId === coach._id ? 'opacity-40' : ''} ${isSearchActive ? 'bg-blue-50/20' : ''}`}
                    >
                      <td className="px-6 py-3.5 text-gray-400 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-700">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-blue-600 text-xs font-bold font-mono">
                          {coach.coachId}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-800">{coach.name}</td>
                      <td className="px-6 py-3.5 text-gray-600">{coach.email || 'N/A'}</td>
                      <td className="px-6 py-3.5 text-gray-600">
                        <span className="inline-flex px-2.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-full text-xs font-bold">
                          {coach.sportSpecialization}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <FiPhone className="text-gray-400 text-xs" /> {coach.contact}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">{coach.experience}</td>
                      {canManageRecords && (
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button type="button"
                              onClick={() => handleEditClick(coach)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer"
                            >
                              <FiEdit2 />
                              <span>Edit</span>
                            </button>
                            <button type="button"
                              onClick={() => handleDelete(coach._id)}
                              disabled={deletingId === coach._id}
                              id={`delete-coach-${coach._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <FiTrash2 />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      )}
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
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Edit Coach Modal */}
      {editCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden print:overflow-visible print:border-none print:shadow-none animate-fade-in-up">
            <div className="px-6 py-5 bg-gray-50/75 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Update Coach Details</h3>
              <button type="button" onClick={() => setEditCoach(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold focus:outline-none">&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Coach ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coach ID</label>
                  <input type="text" className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed" value={editCoach.coachId} disabled />
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input type="text" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editCoach.name} onChange={(e) => setEditCoach({...editCoach, name: e.target.value})} required />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email (Login)</label>
                  <input type="email" placeholder="Set or update email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editCoach.email || ''} onChange={(e) => setEditCoach({...editCoach, email: e.target.value})} />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <input type="password" placeholder="Leave blank to keep unchanged" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editCoach.password || ''} onChange={(e) => setEditCoach({...editCoach, password: e.target.value})} />
                </div>

                {/* Sport Specialization */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sport Specialization</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer"
                    value={editCoach.isOtherSelected ? 'Other' : editCoach.sportSpecialization}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setEditCoach({ ...editCoach, isOtherSelected: true, sportSpecialization: '' });
                      } else {
                        setEditCoach({ ...editCoach, isOtherSelected: false, sportSpecialization: val });
                      }
                    }}
                    required
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
                    <option value="Other">Other</option>
                  </select>
                  {editCoach.isOtherSelected && (
                    <input
                      type="text"
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      value={editCoach.sportSpecialization}
                      onChange={(e) => setEditCoach({ ...editCoach, sportSpecialization: e.target.value })}
                      placeholder="Enter Custom Sport Name"
                      required
                    />
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-400 text-sm"><FiPhone /></span>
                    <input type="text" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editCoach.contact} onChange={(e) => setEditCoach({...editCoach, contact: e.target.value})} required />
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Experience</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-400 text-sm"><FiAward /></span>
                    <input type="text" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" value={editCoach.experience} onChange={(e) => setEditCoach({...editCoach, experience: e.target.value})} required />
                  </div>
                </div>

              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditCoach(null)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition">Cancel</button>
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
