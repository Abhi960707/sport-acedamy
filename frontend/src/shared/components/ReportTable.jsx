import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import { useToast } from '../../common/Toast';
import { FiSearch, FiFileText, FiDollarSign, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ExportDropdown from './ExportDropdown';
import { downloadCsv, downloadPdf } from '../../common/reportExport';

export default function TransactionReport() {
  const toast = useToast();
  const token = localStorage.getItem('token');

  const [payments, setPayments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'collected', 'pending'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, paymentsRes] = await Promise.all([
          api.get('/players/report'),
          api.get('/payments/report'),
        ]);

        setPlayers(playersRes.data.data || []);
        setPayments(paymentsRes.data.data || []);
      } catch (error) {
        toast('Failed to load transaction data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, toast]);

  const toggleRow = (playerId) => {
    setExpandedRows(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  const mergedData = useMemo(() => {
    return players.map(player => {
      const playerTxns = payments.filter(tx => tx.playerId === player.playerId);
      
      const totalFee = parseFloat(player.totalFee) || 0;
      const paidFee = parseFloat(player.payingFee) || 0;
      const pendingFee = parseFloat(player.pendingFee) || 0;
      
      let status = 'Pending';
      if (totalFee > 0 && pendingFee <= 0) status = 'Paid';
      else if (paidFee > 0) status = 'Partial';

      const lastPaymentDate = playerTxns.length > 0 ? playerTxns[0].paymentDate : 'N/A';

      return {
        ...player,
        sportName: player.sportChosen || 'Unknown',
        totalFee,
        paidFee,
        pendingFee,
        status,
        totalTxns: playerTxns.length,
        lastPaymentDate,
        transactions: playerTxns.map(tx => ({
          ...tx,
          receiverName: tx.receivedById ? tx.receivedById.name : 'Legacy Record',
          receiverRole: tx.receivedByRole || 'N/A'
        }))
      };
    });
  }, [players, payments]);

  const searchedData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return mergedData.filter(item => {
      const haystack = [
        item.fullName,
        item.playerId,
        item.sportName,
        item.status
      ].join(' ').toLowerCase();
      
      const txSearch = item.transactions.some(tx => 
        [tx.transactionId, tx.paymentMethod, tx.receiverName].join(' ').toLowerCase().includes(query)
      );

      return !query || haystack.includes(query) || txSearch;
    });
  }, [mergedData, searchQuery]);

  const metrics = useMemo(() => {
    return searchedData.reduce((acc, player) => {
      acc.total += player.totalFee;
      acc.paid += player.paidFee;
      acc.pending += player.pendingFee;
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [searchedData]);

  const filteredData = useMemo(() => {
    if (activeFilter === 'collected') {
      return searchedData.filter(p => p.paidFee > 0);
    }
    if (activeFilter === 'pending') {
      return searchedData.filter(p => p.pendingFee > 0);
    }
    return searchedData;
  }, [searchedData, activeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Partial': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-rose-100 text-rose-700 border-rose-200';
    }
  };

  const handleExportCsv = () => {
    if (!filteredData.length) return toast('No data to export', 'warning');
    
    const csvData = [];
    filteredData.forEach(player => {
      if (player.transactions.length === 0) {
        csvData.push({
          'Player Name': player.fullName,
          'Sport': player.sportName,
          'Total Fee': player.totalFee,
          'Paid': player.paidFee,
          'Pending': player.pendingFee,
          'Status': player.status,
          'Txn Date': 'N/A',
          'Txn Amount': 'N/A',
          'Method': 'N/A',
          'Transaction ID': 'N/A',
          'Received By': 'N/A'
        });
      } else {
        player.transactions.forEach(tx => {
          csvData.push({
            'Player Name': player.fullName,
            'Sport': player.sportName,
            'Total Fee': player.totalFee,
            'Paid': player.paidFee,
            'Pending': player.pendingFee,
            'Status': player.status,
            'Txn Date': tx.paymentDate,
            'Txn Amount': tx.amount,
            'Method': tx.paymentMethod,
            'Transaction ID': tx.transactionId || 'N/A',
            'Received By': `${tx.receiverName} (${tx.receiverRole})`
          });
        });
      }
    });

    const columns = Object.keys(csvData[0]).map(key => ({ label: key, value: key }));
    downloadCsv('transaction-report.csv', columns, csvData);
    toast('Exported as CSV', 'success');
  };

  const handleExportPdf = () => {
    if (!filteredData.length) return toast('No data to export', 'warning');
    
    const pdfData = filteredData.map(player => ({
      playerName: player.fullName,
      sportName: player.sportName,
      totalFee: `Rs ${player.totalFee}`,
      paidFee: `Rs ${player.paidFee}`,
      pendingFee: `Rs ${player.pendingFee}`,
      status: player.status,
      totalTxns: player.totalTxns,
      lastPaymentDate: player.lastPaymentDate
    }));

    const columns = [
      { label: 'Player Name', value: 'playerName' },
      { label: 'Sport', value: 'sportName' },
      { label: 'Total Fee', value: 'totalFee' },
      { label: 'Paid', value: 'paidFee' },
      { label: 'Pending', value: 'pendingFee' },
      { label: 'Status', value: 'status' },
      { label: 'Total Txns', value: 'totalTxns' },
      { label: 'Last Date', value: 'lastPaymentDate' }
    ];

    downloadPdf('transaction-report.pdf', columns, pdfData, 'Transaction Report');
    toast('Exported as PDF', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPlayerStatement = (player) => {
    if (!player.transactions || player.transactions.length === 0) {
      return toast('No transactions to export', 'warning');
    }
    
    const pdfData = player.transactions.map(tx => ({
      date: tx.paymentDate,
      amount: `Rs ${tx.amount}`,
      method: tx.paymentMethod.replace('_', ' '),
      txnId: tx.transactionId || 'N/A',
      receivedBy: `${tx.receiverName} (${tx.receiverRole})`
    }));

    const columns = [
      { label: 'Date', value: 'date' },
      { label: 'Amount', value: 'amount' },
      { label: 'Method', value: 'method' },
      { label: 'Transaction ID', value: 'txnId' },
      { label: 'Received By', value: 'receivedBy' }
    ];

    downloadPdf(`${player.fullName.replace(/\s+/g, '_')}_Statement.pdf`, columns, pdfData, `Transaction Statement - ${player.fullName}`);
    toast('Downloaded Statement', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">
            <FiFileText />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Transaction Report</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Detailed financial overview by player</p>
          </div>
        </div>

        {/* Small Metric Cards / Filters */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 mx-auto xl:mx-0 overflow-x-auto print:overflow-visible print:overflow-x-visible max-w-full hide-scrollbar">
          <button type="button" 
            onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
            className={`flex flex-col px-4 py-2 rounded-lg transition-colors min-w-[120px] ${activeFilter === 'all' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'all' ? 'text-indigo-600' : 'text-gray-400'}`}>Total Expected</span>
            <span className={`text-sm font-bold ${activeFilter === 'all' ? 'text-indigo-900' : 'text-gray-700'}`}>₹{metrics.total.toLocaleString('en-IN')}</span>
          </button>
          
          <div className="w-px bg-gray-100 mx-1 my-2"></div>
          
          <button type="button" 
            onClick={() => { setActiveFilter('collected'); setCurrentPage(1); }}
            className={`flex flex-col px-4 py-2 rounded-lg transition-colors min-w-[120px] ${activeFilter === 'collected' ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-gray-50 border border-transparent'}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'collected' ? 'text-emerald-600' : 'text-gray-400'}`}>Total Collected</span>
            <span className={`text-sm font-bold ${activeFilter === 'collected' ? 'text-emerald-900' : 'text-gray-700'}`}>₹{metrics.paid.toLocaleString('en-IN')}</span>
          </button>
          
          <div className="w-px bg-gray-100 mx-1 my-2"></div>
          
          <button type="button" 
            onClick={() => { setActiveFilter('pending'); setCurrentPage(1); }}
            className={`flex flex-col px-4 py-2 rounded-lg transition-colors min-w-[120px] ${activeFilter === 'pending' ? 'bg-rose-50 border border-rose-100' : 'hover:bg-gray-50 border border-transparent'}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'pending' ? 'text-rose-600' : 'text-gray-400'}`}>Total Pending</span>
            <span className={`text-sm font-bold ${activeFilter === 'pending' ? 'text-rose-900' : 'text-gray-700'}`}>₹{metrics.pending.toLocaleString('en-IN')}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search players or transactions..."
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

      <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden print:overflow-visible print:border-none print:shadow-none">
        <div className="overflow-x-auto print:overflow-visible print:overflow-x-visible">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Finances</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total Txns</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/75 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <span className="inline-block w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="mt-3 text-sm font-semibold text-gray-500">Loading records...</p>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400">
                    <FiDollarSign className="mx-auto text-4xl mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-600">No players found</p>
                  </td>
                </tr>
              ) : (
                currentData.map((player) => (
                  <React.Fragment key={player._id}>
                    {/* Main Row */}
                    <tr 
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedRows[player.playerId] ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => toggleRow(player.playerId)}
                    >
                      <td className="px-6 py-4 text-gray-400">
                        {expandedRows[player.playerId] ? <FiChevronUp className="text-indigo-600" /> : <FiChevronDown />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-800">{player.fullName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">{player.sportName}</span>
                          <span className="ml-2">ID: {player.playerId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(player.status)}`}>
                          {player.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between w-32"><span className="text-gray-500">Total:</span> <span className="font-bold text-gray-700">₹{player.totalFee.toLocaleString('en-IN')}</span></div>
                          <div className="flex justify-between w-32"><span className="text-gray-500">Paid:</span> <span className="font-bold text-emerald-600">₹{player.paidFee.toLocaleString('en-IN')}</span></div>
                          <div className="flex justify-between w-32"><span className="text-gray-500">Pending:</span> <span className="font-bold text-rose-600">₹{player.pendingFee.toLocaleString('en-IN')}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-gray-700 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto">
                          {player.totalTxns}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {player.lastPaymentDate}
                      </td>
                    </tr>
                    
                    {/* Expanded Transactions Sub-table */}
                    {expandedRows[player.playerId] && (
                      <tr>
                        <td colSpan="6" className="p-0 border-b-0 bg-gray-50/50 inset-shadow">
                          <div className="px-10 py-5">
                            {player.transactions.length === 0 ? (
                              <div className="text-center py-6 bg-white rounded-xl border border-gray-100">
                                <FiDollarSign className="mx-auto text-gray-300 text-2xl mb-2" />
                                <p className="text-xs text-gray-500 font-semibold">No transactions recorded for this player.</p>
                              </div>
                            ) : (
                              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:overflow-visible print:border-none print:shadow-none shadow-sm">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-gray-100/50">
                                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Date</th>
                                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Amount</th>
                                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Method</th>
                                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">Txn ID</th>
                                      <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase flex justify-between items-center">
                                        <span>Received By</span>
                                        <button type="button" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadPlayerStatement(player);
                                          }}
                                          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded-md normal-case tracking-normal shadow-sm"
                                        >
                                          Statement
                                        </button>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {player.transactions.map(tx => (
                                      <tr key={tx._id} className="hover:bg-gray-50/30">
                                        <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{tx.paymentDate}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-emerald-600">+₹{parseFloat(tx.amount || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                                          <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">{tx.paymentMethod.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{tx.transactionId || 'N/A'}</td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className={`w-1.5 h-1.5 rounded-full ${tx.receiverName === 'Legacy Record' ? 'bg-gray-300' : 'bg-blue-500'}`}></span>
                                              <div>
                                                <div className={`text-xs font-bold ${tx.receiverName === 'Legacy Record' ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                                                  {tx.receiverName}
                                                </div>
                                                {tx.receiverRole !== 'N/A' && (
                                                  <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">
                                                    {tx.receiverRole}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            {tx.createdAt && (
                                              <div className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs font-semibold text-gray-500">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} players
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
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-white text-gray-600 text-[10px] font-bold rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                Prev
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-white text-gray-600 text-[10px] font-bold rounded-xl transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                Next
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
