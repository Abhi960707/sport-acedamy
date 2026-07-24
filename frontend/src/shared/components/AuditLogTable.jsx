import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import { FiActivity, FiClock, FiFilter, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useToast } from '../../common/Toast';
import ExportDropdown from './ExportDropdown';
import { downloadCsv, downloadPdf } from '../../common/reportExport';

const itemsPerPage = 7;

export default function AuditLog() {
  const toast = useToast();
  const token = localStorage.getItem('sa_token');
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit/report');
        setLogs(res.data.data || []);
      } catch (error) {
        toast('Failed to load audit log', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, actionFilter]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return logs.filter((entry) => {
      const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
      const matchesQuery = !normalizedQuery || [
        entry.action,
        entry.collectionName,
        entry.message,
        entry.recordId,
        entry.actor?.name,
        entry.actor?.email,
      ].some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
      return matchesAction && matchesQuery;
    });
  }, [logs, query, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const reportColumns = [
    { label: 'Action', value: 'action' },
    { label: 'Collection', value: 'collectionName' },
    { label: 'Message', value: 'message' },
    { label: 'Record ID', value: 'recordId' },
    { label: 'User Name', value: (row) => row.actor?.name || 'System' },
    { label: 'User Email', value: (row) => row.actor?.email || 'unknown' },
    { label: 'Date', value: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      toast('No audit logs available to export', 'warning');
      return;
    }
    downloadCsv('audit-logs.csv', reportColumns, filteredLogs);
    toast('Audit logs exported as CSV', 'success');
  };

  const handleExportPdf = () => {
    if (!filteredLogs.length) {
      toast('No audit logs available to export', 'warning');
      return;
    }
    downloadPdf('audit-logs.pdf', reportColumns, filteredLogs, 'Audit Logs Report');
    toast('Audit logs exported as PDF', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
            <FiActivity />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Audit Log</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'} tracked
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onPrint={handlePrint}
            showPrint={true}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiSearch /></span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activity..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="relative w-full md:w-56">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiFilter /></span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-gray-50 animate-pulse" />)}
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3 flex justify-center"><FiActivity /></div>
            <p className="text-sm font-medium">No audit events found.</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-2">
            {paginatedLogs.map((entry) => (
              <div key={entry._id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                      {entry.action}
                    </span>
                    <span className="text-sm font-bold text-gray-800 capitalize">{entry.collectionName}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{entry.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1 break-all">Record: {entry.recordId || '-'}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-700">{entry.actor?.name || 'System'}</div>
                  <div className="text-[11px] text-gray-400">{entry.actor?.email || 'unknown'}</div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                    <FiClock /> {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold">Showing page {currentPage} of {totalPages}</span>
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
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
    </div>
  );
}