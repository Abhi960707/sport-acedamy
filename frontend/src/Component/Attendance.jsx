import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import { FiCalendar, FiCheckCircle, FiClock, FiSearch, FiTrash2, FiUserCheck, FiXCircle } from 'react-icons/fi';
import { canManageAcademyRecords } from './access';
import ExportDropdown from './ExportDropdown';
import { downloadCsv, downloadPdf } from './reportExport';

const todayValue = new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const toast = useToast();
  const token = localStorage.getItem('token');
  const canManageRecords = canManageAcademyRecords();

  const [players, setPlayers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('attendanceFormDraft');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      playerId: '',
      attendanceDate: todayValue,
      status: 'present',
      note: '',
    };
  });

  useEffect(() => {
    localStorage.setItem('attendanceFormDraft', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, recordsRes] = await Promise.all([
          axios.get('http://localhost:4005/attendance/players', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:4005/attendance/report', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setPlayers(playersRes.data.data || []);
        setRecords(recordsRes.data.data || []);
      } catch (error) {
        toast('Failed to load attendance data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManageRecords) {
      toast('You do not have permission to mark attendance', 'warning');
      return;
    }

    if (!form.playerId || !form.attendanceDate || !form.status) {
      toast('Player, date, and status are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('http://localhost:4005/attendance/mark', form, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setRecords((prev) => {
          const next = prev.filter((item) => item._id !== response.data.data._id);
          return [response.data.data, ...next];
        });
        setForm((prev) => ({ ...prev, note: '' }));
        toast('Attendance saved successfully', 'success');
      } else {
        toast(response.data.message || 'Failed to save attendance', 'error');
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Server error while saving attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManageRecords) {
      toast('You do not have permission to delete attendance records', 'warning');
      return;
    }

    if (!window.confirm('Delete this attendance record?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`http://localhost:4005/attendance/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        setRecords((prev) => prev.filter((item) => item._id !== id));
        toast('Attendance deleted successfully', 'success');
      } else {
        toast(result.message || 'Failed to delete attendance', 'error');
      }
    } catch (error) {
      toast('Server error during deletion', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return records.filter((record) => {
      const haystack = [record.playerName, record.playerId, record.attendanceDate, record.status, record.note].join(' ').toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [records, searchQuery]);

  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((record) => record.status === 'present').length;
    const absent = filteredRecords.filter((record) => record.status === 'absent').length;
    return { total, present, absent };
  }, [filteredRecords]);

  const reportColumns = [
    { label: 'Player ID', value: 'playerId' },
    { label: 'Player Name', value: 'playerName' },
    { label: 'Attendance Date', value: 'attendanceDate' },
    { label: 'Status', value: 'status' },
    { label: 'Note', value: 'note' },
  ];

  const handleExportCsv = () => {
    if (!filteredRecords.length) {
      toast('No attendance records available to export', 'warning');
      return;
    }
    downloadCsv('attendance-report.csv', reportColumns, filteredRecords);
    toast('Attendance report exported as CSV', 'success');
  };

  const handleExportPdf = () => {
    if (!filteredRecords.length) {
      toast('No attendance records available to export', 'warning');
      return;
    }
    downloadPdf('attendance-report.pdf', reportColumns, filteredRecords, 'Attendance Report');
    toast('Attendance report exported as PDF', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
            <FiUserCheck />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Attendance Tracker</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Track player presence across training sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search attendance records..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <ExportDropdown
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onPrint={handlePrint}
            showPrint={true}
          />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Records', value: summary.total, icon: <FiClock />, filter: '' },
          { label: 'Present', value: summary.present, icon: <FiCheckCircle />, filter: 'present' },
          { label: 'Absent', value: summary.absent, icon: <FiXCircle />, filter: 'absent' },
        ].map((card) => (
          <div key={card.label} onClick={() => setSearchQuery(card.filter)} className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-lg">{card.icon}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/75">
            <h3 className="text-lg font-bold text-gray-800">Mark Attendance</h3>
            <p className="text-xs text-gray-500 mt-1">Save attendance per player and day.</p>
          </div>
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="attendance-player">Player</label>
              <select
                id="attendance-player"
                name="playerId"
                value={form.playerId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key={player._id} value={player._id}>{player.fullName} ({player.playerId})</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="attendance-date">Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="attendance-date"
                    type="date"
                    name="attendanceDate"
                    value={form.attendanceDate}
                    max={todayValue}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="attendance-status">Status</label>
                <select
                  id="attendance-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="attendance-note">Note</label>
              <textarea
                id="attendance-note"
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={3}
                placeholder="Optional note"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !canManageRecords}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saving && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {canManageRecords ? 'Save Attendance' : 'Read Only Access'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/75 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Recent Attendance</h3>
              <p className="text-xs text-gray-500 mt-1">Latest records in the system.</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{filteredRecords.length} records</span>
          </div>

          <div className="p-3 sm:p-4 space-y-2 max-h-[720px] overflow-auto">
            {loading ? (
              <div className="py-16 text-center text-gray-500">
                <span className="inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-3 text-sm font-semibold">Loading attendance...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FiClock className="mx-auto text-4xl mb-3" />
                <p className="text-sm font-semibold text-gray-700">No attendance records found</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <article key={record._id} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{record.playerName}</h4>
                      <p className="text-xs text-gray-500">{record.playerId}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                      record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-100' :
                      record.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {record.status === 'present' ? <FiCheckCircle /> : <FiXCircle />}
                      {record.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 rounded-full bg-white border border-gray-200">Date: {record.attendanceDate}</span>
                    {record.note && <span className="px-2 py-1 rounded-full bg-white border border-gray-200">Note: {record.note}</span>}
                  </div>

                  {canManageRecords && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(record._id)}
                        disabled={deletingId === record._id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}