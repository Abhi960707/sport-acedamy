import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../api';
import { useToast } from '../../common/Toast';
import { FiSearch } from 'react-icons/fi';

export default function AcademyTable({ role }) {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const showToast = useToast();

  const fetchAcademies = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sa_token');
      const res = await fetch(`${API_BASE}/superadmin/academies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAcademies(data.data);
      } else {
        showToast(data.message || 'Failed to fetch academies', 'error');
      }
    } catch (err) {
      showToast('Error fetching academies', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchAcademies();
  }, [fetchAcademies]);

  const filteredAcademies = academies.filter(academy => 
    (academy.academyName || '').toLowerCase().includes(search.toLowerCase()) || 
    (academy.owner?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredAcademies.length / itemsPerPage));
  const paginatedAcademies = filteredAcademies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Academy Management</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search academies by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto print:overflow-visible print:overflow-x-visible">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Academy Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : paginatedAcademies.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No academies found.</td></tr>
              ) : (
                paginatedAcademies.map(academy => (
                  <tr key={academy._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">{academy.academyName}</td>
                    <td className="px-6 py-4 text-gray-700">{academy.owner?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{academy.email || academy.owner?.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${academy.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {academy.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs font-semibold text-gray-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-white"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
