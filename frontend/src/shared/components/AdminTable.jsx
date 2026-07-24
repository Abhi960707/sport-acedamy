import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../api';
import { useToast } from '../../common/Toast';
import { FiEdit, FiTrash2, FiSearch, FiPlus, FiX } from 'react-icons/fi';

export default function AdminTable({ role }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const showToast = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', email: '', password: '', role: 'admin', contactNumber: '', academyName: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sa_token');
      const res = await fetch(`${API_BASE}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        showToast(data.message || 'Failed to fetch admins', 'error');
      }
    } catch (err) {
      showToast('Error fetching admins', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setFormData({ 
        id: admin._id, 
        name: admin.name || '', 
        email: admin.email || '', 
        password: '', 
        role: admin.role || 'admin',
        contactNumber: admin.contactNumber || '',
        academyName: admin.academyName || ''
      });
    } else {
      setFormData({ id: null, name: '', email: '', password: '', role: 'admin', contactNumber: '', academyName: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend Validations
    const nameVal = (formData.name || '').trim();
    const emailVal = (formData.email || '').trim();
    const contactVal = (formData.contactNumber || '').trim();
    const passwordVal = formData.password;

    if (!nameVal) {
      return showToast('Full Name is required', 'warning');
    }
    if (!/^[a-zA-Z\s]+$/.test(nameVal)) {
      return showToast('Full Name must contain only alphabets and spaces', 'warning');
    }
    if (!emailVal) {
      return showToast('Email Address is required', 'warning');
    }
    if (!/\S+@\S+\.\S+/.test(emailVal)) {
      return showToast('Please enter a valid email address format', 'warning');
    }
    if (contactVal && !/^\d{10}$/.test(contactVal)) {
      return showToast('Contact Number must be exactly 10 digits', 'warning');
    }
    if (!formData.id && (!passwordVal || passwordVal.length < 4)) {
      return showToast('Password is required and must be at least 4 characters long', 'warning');
    }
    if (formData.id && passwordVal && passwordVal.length < 4) {
      return showToast('New password must be at least 4 characters long', 'warning');
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('sa_token');
      const url = formData.id ? `${API_BASE}/superadmin/admins/update/${formData.id}` : `${API_BASE}/superadmin/admins/create`;
      const method = formData.id ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (formData.id && !formData.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setShowModal(false);
        fetchAdmins();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Server error. Please try again.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      const token = localStorage.getItem('sa_token');
      const res = await fetch(`${API_BASE}/superadmin/admins/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchAdmins();
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Server error. Please try again.', 'error');
    }
  };

  const filteredAdmins = admins.filter(admin => 
    (admin.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (admin.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / itemsPerPage));
  const paginatedAdmins = filteredAdmins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
        <button type="button" onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition cursor-pointer">
          <FiPlus /> Add Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search admins by name or email..." 
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Contact No.</th>
                <th className="px-6 py-4">Academy Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : paginatedAdmins.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No admins found.</td></tr>
              ) : (
                paginatedAdmins.map(admin => (
                  <tr key={admin._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{admin.name || 'N/A'}</td>
                    <td className="px-6 py-4">{admin.email}</td>
                    <td className="px-6 py-4">{admin.contactNumber || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{admin.academyName || 'Not Configured'}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{admin.role}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => handleOpenModal(admin)} className="text-blue-600 hover:text-blue-800 p-2 cursor-pointer"><FiEdit /></button>
                      <button type="button" onClick={() => handleDelete(admin._id)} className="text-red-600 hover:text-red-800 p-2 cursor-pointer"><FiTrash2 /></button>
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
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-white cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-white cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 bg-gray-50/75 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{formData.id ? 'Edit Admin' : 'Add New Admin'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Academy Name (Optional)</label>
                <input type="text" value={formData.academyName} onChange={(e) => setFormData({...formData, academyName: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Contact Number</label>
                <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{formData.id ? 'New Password (Optional)' : 'Password *'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" required={!formData.id} />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-bold flex items-center gap-2 cursor-pointer">
                  {submitLoading ? 'Saving...' : 'Save Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
