import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../api';
import { useToast } from '../../common/Toast';
import { FiSearch, FiChevronDown, FiChevronUp, FiEye, FiEyeOff, FiActivity, FiUsers, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function LoginLogTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const toast = useToast();
  
  // Track expanded row IDs
  const [expandedRows, setExpandedRows] = useState({});
  // Track global passwords visibility toggle
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sa_token');
      const res = await fetch(`${API_BASE}/superadmin/login-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        toast(data.message || 'Failed to fetch login logs', 'error');
      }
    } catch (err) {
      toast('Error loading login logs report', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredLogs = logs.filter(log => 
    (log.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (log.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.academyName || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">
            <FiActivity />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Login Log Reports</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Monitor active administrators, credentials, and coaching rosters
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by admin name, email, or academy..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Admin Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 w-40">
                  <div className="flex items-center gap-1.5 select-none">
                    <span>Password</span>
                    <button 
                      type="button" 
                      onClick={() => setShowAllPasswords(!showAllPasswords)} 
                      className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer flex items-center justify-center p-0.5 rounded-lg hover:bg-gray-100 transition"
                      title={showAllPasswords ? "Hide all passwords" : "Show all passwords"}
                    >
                      {showAllPasswords ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </th>
                <th className="px-6 py-4">Academy Name</th>
                <th className="px-6 py-4 text-center">Coaches</th>
                <th className="px-6 py-4 text-center">Players</th>
                <th className="px-6 py-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-20 text-gray-400">
                    <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full mb-2" />
                    <div className="text-xs font-semibold">Loading logins and credentials...</div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16 text-gray-500 font-medium">
                    No login logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(admin => {
                  const isExpanded = !!expandedRows[admin.id];

                  return (
                    <React.Fragment key={admin.id}>
                      {/* Admin Row */}
                      <tr 
                        onClick={() => toggleRow(admin.id)}
                        className="hover:bg-gray-50/50 transition cursor-pointer select-none"
                      >
                        <td className="px-6 py-4 text-center font-medium">
                          {isExpanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2 mt-1">
                          <FiUser className="text-indigo-500" /> {admin.name}
                        </td>
                        <td className="px-6 py-4">{admin.email}</td>
                        <td className="px-6 py-4 font-medium">{admin.contactNumber}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="font-mono text-xs">
                            {showAllPasswords ? (admin.plainPassword || 'N/A (Hashed Only)') : '••••••••'}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-600">{admin.academyName}</td>
                        <td className="px-6 py-4 text-center font-bold text-gray-800">{admin.coachesCount}</td>
                        <td className="px-6 py-4 text-center font-bold text-gray-800">{admin.playerCount}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          ₹{admin.totalRevenue.toLocaleString()}
                        </td>
                      </tr>

                      {/* Expanded Row details: Coaches list */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="9" className="px-10 py-6 bg-slate-50/70 border-t border-b border-gray-100">
                            <div className="space-y-3 animate-fade-in">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <FiUsers className="text-indigo-500 text-sm" /> 
                                Coaches Configured under {admin.academyName}
                              </div>

                              {admin.coaches.length === 0 ? (
                                <div className="text-xs text-gray-400 italic py-2 pl-2">
                                  No coaches registered under this academy.
                                </div>
                              ) : (
                                <div className="border border-gray-200/60 rounded-2xl overflow-hidden bg-white shadow-sm max-w-4xl">
                                  <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-gray-50/70 text-[10px] uppercase font-semibold text-gray-400 border-b border-gray-200/50">
                                      <tr>
                                        <th className="px-4 py-2.5">Coach Name</th>
                                        <th className="px-4 py-2.5">Email</th>
                                        <th className="px-4 py-2.5">Contact No.</th>
                                        <th className="px-4 py-2.5 w-48">
                                          <div className="flex items-center gap-1.5 select-none">
                                            <span>Credential Password</span>
                                            <button 
                                              type="button" 
                                              onClick={() => setShowAllPasswords(!showAllPasswords)} 
                                              className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer flex items-center justify-center p-0.5 rounded-md hover:bg-gray-100/50 transition"
                                              title={showAllPasswords ? "Hide all passwords" : "Show all passwords"}
                                            >
                                              {showAllPasswords ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {admin.coaches.map((c, index) => {

                                        return (
                                          <tr key={index} className="hover:bg-gray-50/30">
                                            <td className="px-4 py-2.5 font-bold text-gray-800">{c.name}</td>
                                            <td className="px-4 py-2.5">{c.email}</td>
                                            <td className="px-4 py-2.5 font-medium">{c.contact || 'N/A'}</td>
                                            <td className="px-4 py-2.5">
                                              <div className="font-mono text-xs">
                                                {showAllPasswords ? (c.plainPassword || 'N/A (Hashed Only)') : '••••••••'}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
            <span className="text-xs font-semibold text-gray-500">Page {currentPage} of {totalPages}</span>
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
    </div>
  );
}
