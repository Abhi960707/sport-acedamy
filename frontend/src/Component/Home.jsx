import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { FiAward, FiUsers, FiUserCheck, FiArrowRight, FiClock, FiActivity, FiTrendingUp, FiPieChart, FiBarChart } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useToast } from './Toast';
import CoachDashboard from './CoachDashboard';
import { getStoredRole } from './access';
export default function Home() {
  const userRole = getStoredRole();

  // ─── ALL HOOKS must be called unconditionally BEFORE any early return ───
  const toast = useToast();
  const [stats, setStats] = useState({
    playersCount: 0,
    coachesCount: 0,
    gamesCount: 0,
    totalRevenue: 0,
    pendingFees: 0,
  });
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playersData, setPlayersData] = useState([]);

  useEffect(() => {
    // Skip data fetching entirely for coaches – CoachDashboard handles its own data
    if (userRole === 'coach') return;

    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        const [playersRes, coachesRes, gamesRes, auditRes] = await Promise.all([
          api.get('/players/report'),
          api.get('/coach/report'),
          api.get('/games/report'),
          api.get('/audit/report'),
        ]);

        if (controller.signal.aborted) return;

        const playersList = playersRes.data.data || [];
        const coachesList = coachesRes.data.data || [];
        const gamesList = gamesRes.data.data || [];
        const auditList = auditRes.data.data || [];

        setPlayersData(playersList);

        let revenue = 0;
        let pending = 0;
        playersList.forEach(p => {
          revenue += parseFloat(p.payingFee) || 0;
          pending += parseFloat(p.pendingFee) || 0;
        });

        setStats({
          playersCount: playersList.length,
          coachesCount: coachesList.length,
          gamesCount: gamesList.length,
          totalRevenue: revenue,
          pendingFees: pending,
        });

        const sortedPlayers = [...playersList]
          .sort((a, b) => new Date(b.joiningDate || 0) - new Date(a.joiningDate || 0))
          .slice(0, 4);
        setRecentPlayers(sortedPlayers);

        setRecentActivity(
          [...auditList]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 4)
        );

      } catch (err) {
        if (controller.signal.aborted) return;
        toast('Failed to load dashboard metrics', 'error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, [toast, userRole]);

  // Chart 1: Admissions by Month (Line Chart)
  const lineChartData = useMemo(() => {
    if (!playersData.length) return [];
    
    // Group by Month (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      counts[key] = { label: key, count: 0, index: d.getMonth() };
    }

    playersData.forEach(player => {
      if (!player.joiningDate) return;
      const date = new Date(player.joiningDate);
      if (isNaN(date.getTime())) return;
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      if (counts[key]) {
        counts[key].count += 1;
      }
    });

    return Object.values(counts);
  }, [playersData]);

  // SVG coordinates for Line Chart
  const linePoints = useMemo(() => {
    if (!lineChartData.length) return "";
    const maxVal = Math.max(...lineChartData.map(d => d.count), 5);
    const width = 340;
    const height = 120;
    const padding = 20;

    return lineChartData.map((d, i) => {
      const x = padding + (i * (width - 2 * padding) / (lineChartData.length - 1));
      const y = height - padding - (d.count * (height - 2 * padding) / maxVal);
      return { x, y, val: d.count, label: d.label };
    });
  }, [lineChartData]);

  // Chart 2: Players by Sport (Donut Chart)
  const donutData = useMemo(() => {
    const sports = {};
    playersData.forEach(p => {
      if (p.sportChosen) {
        sports[p.sportChosen] = (sports[p.sportChosen] || 0) + 1;
      }
    });
    const sorted = Object.entries(sports).map(([name, count]) => ({ name, count }));
    const total = sorted.reduce((sum, item) => sum + item.count, 0);

    const colors = ['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#ea580c', '#eab308'];

    let accumulatedPercentage = 0;
    return sorted.slice(0, 5).map((item, idx) => {
      const pct = (item.count / total) * 100;
      const offset = 100 - accumulatedPercentage;
      accumulatedPercentage += pct;
      return {
        ...item,
        pct: Math.round(pct),
        color: colors[idx % colors.length],
        strokeDasharray: `${pct} ${100 - pct}`,
        strokeDashoffset: (offset * 2.51).toFixed(1), // Scale to stroke circumference (2 * pi * r ≈ 251.2 for r=40)
      };
    });
  }, [playersData]);

  // ─── Coach early return AFTER all hooks ───
  if (userRole === 'coach') {
    return <CoachDashboard />;
  }


  const cards = [
    {
      title: 'Total Players',
      value: stats.playersCount,
      icon: <FiUserCheck />,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/10',
      description: 'Active enrollments',
      link: '/reportplayers'
    },
    {
      title: 'Total Coaches',
      value: stats.coachesCount,
      icon: <FiUsers />,
      color: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/10',
      description: 'Academy instructors',
      link: '/reportcoachs'
    },
    {
      title: 'Total Games',
      value: stats.gamesCount,
      icon: <FiAward />,
      color: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/10',
      description: 'Sports specialized',
      link: '/reportgame'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: <FaRupeeSign />,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/10',
      description: 'Collected fee earnings',
      link: '/payment'
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString('en-IN')}`,
      icon: <FaRupeeSign />,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/10',
      description: 'Awaiting collection',
      link: '/reportplayers?query=pending'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100">
            ⚡ Welcome to the Management Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
            Sport Academy Dashboard
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Manage your entire academy's operations, register incoming players, assign coaches, check fees status, and generate reports from one live control center.
          </p>
        </div>
      </section>

      {/* Metrics Statistics Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-800">Key Statistics</h2>
          <p className="text-xs text-gray-500">Live operational data calculated from records</p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {cards.map((card, i) => (
              <Link
                key={i}
                to={card.link}
                className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-lg ${card.shadow} flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-200 block`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.title}</span>
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white text-base shadow-sm`}>
                    {card.icon}
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">{card.value}</h3>
                  <p className="text-[10px] text-gray-400 font-medium">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Charts Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Admissions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FiTrendingUp className="text-blue-500" /> Monthly Admissions
              </h3>
              <p className="text-[10px] text-gray-400">Newly enrolled players (last 6 months)</p>
            </div>
          </div>
          {loading ? (
            <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
          ) : linePoints.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-400">No enrollment history</div>
          ) : (
            <div className="w-full">
              <svg viewBox="0 0 340 120" className="w-full h-32">
                {/* Gradient area */}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Filled Area */}
                <path
                  d={`M ${linePoints[0].x} 100 ` + linePoints.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${linePoints[linePoints.length - 1].x} 100 Z`}
                  fill="url(#areaGrad)"
                />

                {/* Line Path */}
                <path
                  d={linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dots & Tooltips */}
                {linePoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1e3a8a">{p.val}</text>
                    <text x={p.x} y="112" textAnchor="middle" fontSize="8" fill="#9ca3af">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Donut Chart: Players by Sport */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FiPieChart className="text-purple-500" /> Players by Sport
              </h3>
              <p className="text-[10px] text-gray-400">Popular sports chosen by players</p>
            </div>
          </div>
          {loading ? (
            <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
          ) : donutData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-400">No players registered yet</div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <svg viewBox="0 0 100 100" className="w-24 h-24">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                {donutData.map((d, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={d.color}
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={d.strokeDashoffset}
                    transform="rotate(-90 50 50)"
                  />
                ))}
              </svg>
              <div className="flex-1 space-y-1.5">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[100px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 truncate">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Double Bar Chart: Revenue vs Pending */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FiBarChart className="text-emerald-500" /> Revenue Breakdown
              </h3>
              <p className="text-[10px] text-gray-400">Received revenue vs outstanding balance</p>
            </div>
          </div>
          {loading ? (
            <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-4 pt-1">
              {/* Revenue Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-600">Collected (Revenue)</span>
                  <span className="text-gray-700">₹{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${(stats.totalRevenue / (stats.totalRevenue + stats.pendingFees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Pending Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-red-500">Outstanding (Pending)</span>
                  <span className="text-gray-700">₹{stats.pendingFees.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full" 
                    style={{ width: `${(stats.pendingFees / (stats.totalRevenue + stats.pendingFees || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* Bottom Main Content Panel (Quick Actions & Recent Enrollments) */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: Quick Actions */}
        <section className="lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold font-display text-gray-800">Quick Access</h2>
            <p className="text-xs text-gray-500">Jump straight to registrations and actions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/games"
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 group transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FiAward className="text-lg" />
                </span>
                <div className="leading-tight">
                  <h4 className="text-sm font-bold text-gray-700">Add Game</h4>
                  <span className="text-[10px] text-gray-400">Register sport</span>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/coach"
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-200 group transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <FiUsers className="text-lg" />
                </span>
                <div className="leading-tight">
                  <h4 className="text-sm font-bold text-gray-700">Add Coach</h4>
                  <span className="text-[10px] text-gray-400">Register coach</span>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/player"
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 group transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <FiUserCheck className="text-lg" />
                </span>
                <div className="leading-tight">
                  <h4 className="text-sm font-bold text-gray-700">Add Player</h4>
                  <span className="text-[10px] text-gray-400">Enroll player</span>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/payment"
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 group transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <FaRupeeSign className="text-lg" />
                </span>
                <div className="leading-tight">
                  <h4 className="text-sm font-bold text-gray-700">Payments Hub</h4>
                  <span className="text-[10px] text-gray-400">Add/View Payments</span>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Right Side: Recent Activity (Latest Enrolled Players) */}
        <section className="lg:col-span-7 space-y-4">
          <div>
            <h2 className="text-lg font-bold font-display text-gray-800">Recent Enrollments</h2>
            <p className="text-xs text-gray-500">Newly registered players in the academy</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <span className="text-3xl mb-2">🏃</span>
                <p className="text-xs">No recent player enrollments found.</p>
                <Link to="/player" className="text-xs text-blue-600 font-bold hover:underline mt-1">Enroll one now</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPlayers.map((player) => (
                  <div key={player._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {player.fullName.charAt(0)}
                      </span>
                      <div className="leading-tight">
                        <h4 className="text-sm font-bold text-gray-700">{player.fullName}</h4>
                        <span className="text-[10px] text-gray-400">ID: {player.playerId} &bull; Sport: {player.sportChosen}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xs font-semibold text-gray-600">₹{player.totalFee}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-gray-400 uppercase mt-0.5">
                        <FiClock /> {player.joiningDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Latest Activity Panel */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-display text-gray-800">Latest Activity</h2>
            <p className="text-xs text-gray-500">Recent audit entries from the system</p>
          </div>
          <Link to="/audit" className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap">
            View all
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
              <span className="text-3xl mb-2"><FiActivity /></span>
              <p className="text-xs">No recent activity found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-700 capitalize">{item.action} {item.collectionName}</h4>
                    <span className="text-[10px] text-gray-400 truncate block">
                      {item.actor?.name || 'System'} • {item.message || 'Activity recorded'}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-xs font-semibold text-gray-600 capitalize">{item.actor?.role || 'admin'}</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-gray-400 uppercase mt-0.5">
                      <FiClock /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
