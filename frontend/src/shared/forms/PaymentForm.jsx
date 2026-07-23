import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import { useToast } from '../../common/Toast';
import { FiDollarSign, FiSearch, FiCheckCircle, FiClock, FiCreditCard, FiPrinter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { canMarkAttendanceAndPayments } from '../../common/access';
import ExportDropdown from '../components/ExportDropdown';
import { downloadCsv, downloadPdf } from '../../common/reportExport';

const todayValue = new Date().toISOString().slice(0, 10);

export default function Payment() {
  const toast = useToast();
  const token = localStorage.getItem('token');
  const canManageRecords = canMarkAttendanceAndPayments();

  const [players, setPlayers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('paymentFormDraft');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      playerId: '',
      amount: '',
      paymentMethod: 'cash',
      transactionId: '',
      paymentDate: todayValue,
    };
  });

  useEffect(() => {
    localStorage.setItem('paymentFormDraft', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, recordsRes] = await Promise.all([
          api.get('/players/report'),
          api.get('/payments/report'),
        ]);

        setPlayers(playersRes.data.data || []);
        setRecords(recordsRes.data.data || []);
      } catch (error) {
        toast('Failed to load payment data', 'error');
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
      toast('You do not have permission to add payments', 'warning');
      return;
    }

    if (!form.playerId || !form.amount || !form.paymentMethod || !form.paymentDate) {
      toast('Player, amount, date, and method are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/payments/add', form);

      if (response.data.success) {
        setRecords((prev) => {
          return [response.data.data, ...prev];
        });
        setForm((prev) => ({ ...prev, amount: '', transactionId: '' }));
        toast('Payment recorded successfully', 'success');
        
        // Refresh players to get updated balances
        const playersRes = await api.get('/players/report');
        setPlayers(playersRes.data.data || []);

      } else {
        toast(response.data.message || 'Failed to record payment', 'error');
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Server error while recording payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return records.filter((record) => {
      const haystack = [record.playerName, record.playerId, record.transactionId, record.paymentMethod].join(' ').toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [records, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const summary = useMemo(() => {
    const totalCount = filteredRecords.length;
    const totalAmount = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    return { totalCount, totalAmount };
  }, [filteredRecords]);

  const reportColumns = [
    { label: 'Player Name', value: 'playerName' },
    { label: 'Payment Date', value: 'paymentDate' },
    { label: 'Amount', value: 'amount' },
    { label: 'Method', value: 'paymentMethod' },
    { label: 'Transaction ID', value: 'transactionId' },
  ];

  const handleExportCsv = () => {
    if (!filteredRecords.length) {
      toast('No payment records available to export', 'warning');
      return;
    }
    downloadCsv('payment-report.csv', reportColumns, filteredRecords);
    toast('Payment report exported as CSV', 'success');
  };

  const handleExportPdf = () => {
    if (!filteredRecords.length) {
      toast('No payment records available to export', 'warning');
      return;
    }
    downloadPdf('payment-report.pdf', reportColumns, filteredRecords, 'Payment Report');
    toast('Payment report exported as PDF', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintReceipt = (record) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) {
      toast('Pop-up blocker prevented receipt opening', 'warning');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Payment Receipt - ${record.playerName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .receipt-box { max-width: 500px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #eee; padding-bottom: 15px; }
            .header h2 { margin: 0; color: #1e3a8a; }
            .header p { margin: 5px 0 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .label { font-weight: bold; color: #555; }
            .val { color: #111; }
            .amount-section { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
            .amount-val { font-size: 24px; font-weight: bold; color: #15803d; }
            .footer { text-align: center; margin-top: 35px; border-top: 1px solid #eee; padding-top: 15px; font-size: 11px; color: #888; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
            .sig-line { width: 150px; border-top: 1px solid #ccc; text-align: center; padding-top: 5px; color: #666; }
            @media print {
              body { padding: 0; }
              .receipt-box { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2>Sport Academy</h2>
              <p>Payment Receipt</p>
            </div>
            <div class="details-row">
              <span class="label">Date:</span>
              <span class="val">${record.paymentDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Player Name:</span>
              <span class="val">${record.playerName}</span>
            </div>
            <div class="details-row">
              <span class="label">Player ID:</span>
              <span class="val">${record.playerId}</span>
            </div>
            <div class="details-row">
              <span class="label">Payment Method:</span>
              <span class="val" style="text-transform: uppercase;">${record.paymentMethod}</span>
            </div>
            ${record.transactionId ? `
            <div class="details-row">
              <span class="label">Transaction ID:</span>
              <span class="val">${record.transactionId}</span>
            </div>` : ''}
            
            <div class="amount-section">
              <div style="font-size: 12px; color: #166534; font-weight: bold; text-transform: uppercase;">Amount Paid</div>
              <div class="amount-val">₹${parseFloat(record.amount).toLocaleString('en-IN')}</div>
            </div>

            <div class="signature">
              <div class="sig-line">Player Signature</div>
              <div class="sig-line">Authorized Signatory</div>
            </div>

            <div class="footer">
              Thank you for your payment! This is a computer generated receipt.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const selectedPlayer = useMemo(() => {
    return players.find(p => p.playerId === form.playerId) || null;
  }, [players, form.playerId]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-2xl shadow-sm">
            <FiDollarSign />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Payment Management</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Track player fees and transactions</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search payments..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div onClick={() => setSearchQuery('')} className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Transactions</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">{summary.totalCount}</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600 text-lg"><FiCreditCard /></span>
          </div>
        </div>
        <div onClick={() => setSearchQuery('')} className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Amount Received</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">₹{summary.totalAmount.toLocaleString()}</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600 text-lg"><FiCheckCircle /></span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/75">
            <h3 className="text-lg font-bold text-gray-800">Record Payment</h3>
            <p className="text-xs text-gray-500 mt-1">Add a new payment transaction.</p>
          </div>
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="payment-player">Player</label>
              <select
                id="payment-player"
                name="playerId"
                value={form.playerId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key={player._id} value={player.playerId}>{player.fullName} ({player.playerId})</option>
                ))}
              </select>
            </div>

            {selectedPlayer && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex justify-between items-center text-sm">
                <div>
                  <span className="block text-xs text-blue-500 font-semibold uppercase">Total Fee</span>
                  <span className="font-bold text-blue-800">₹{selectedPlayer.totalFee || 0}</span>
                </div>
                <div>
                  <span className="block text-xs text-blue-500 font-semibold uppercase">Paid</span>
                  <span className="font-bold text-emerald-600">₹{selectedPlayer.payingFee || 0}</span>
                </div>
                <div>
                  <span className="block text-xs text-blue-500 font-semibold uppercase">Pending</span>
                  <span className="font-bold text-red-600">₹{selectedPlayer.pendingFee || 0}</span>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="payment-amount">Amount (₹)</label>
                <input
                  id="payment-amount"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="payment-date">Date</label>
                <input
                  id="payment-date"
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate}
                  max={todayValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="payment-method">Method</label>
                <select
                  id="payment-method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="payment-transactionId">Transaction ID (Optional)</label>
                <input
                  id="payment-transactionId"
                  type="text"
                  name="transactionId"
                  value={form.transactionId}
                  onChange={handleChange}
                  placeholder="e.g. TXN12345"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !canManageRecords}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {saving && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {canManageRecords ? 'Record Payment' : 'Read Only Access'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/75 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
              <p className="text-xs text-gray-500 mt-1">Latest payments in the system.</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{filteredRecords.length} records</span>
          </div>

          <div className="p-4 sm:p-6 space-y-3 max-h-[720px] overflow-auto">
            {loading ? (
              <div className="py-16 text-center text-gray-500">
                <span className="inline-block w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" />
                <p className="mt-3 text-sm font-semibold">Loading payments...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FiClock className="mx-auto text-4xl mb-3" />
                <p className="text-sm font-semibold text-gray-700">No payment records found</p>
              </div>
            ) : (
              paginatedRecords.map((record) => (
                <article key={record._id} className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{record.playerName}</h4>
                      <p className="text-[11px] text-gray-500">{record.paymentDate}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-green-700 bg-green-100">
                      ₹{record.amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-500">
                      <span className="px-1.5 py-0.5 rounded-md bg-white border border-gray-200 capitalize">Method: {record.paymentMethod.replace('_', ' ')}</span>
                      {record.transactionId && <span className="px-1.5 py-0.5 rounded-md bg-white border border-gray-200">Txn: {record.transactionId}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(record)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                    >
                      <FiPrinter className="w-3 h-3" />
                      Print
                    </button>
                  </div>
                </article>
              ))
            )}
            
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-500">
                  Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
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
                          ? 'bg-green-600 text-white shadow-md shadow-green-500/10'
                          : 'border border-transparent hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
      </section>
    </div>
  );
}
