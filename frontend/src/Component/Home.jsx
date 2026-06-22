import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiAward, FiUsers, FiUserCheck, FiArrowRight, FiClock } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useToast } from './Toast';

export default function Home() {
  const toast = useToast();
  const [stats, setStats] = useState({
    playersCount: 0,
    coachesCount: 0,
    gamesCount: 0,
    totalRevenue: 0,
    pendingFees: 0,
  });
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Fetch players, coaches, and games in parallel
        const [playersRes, coachesRes, gamesRes] = await Promise.all([
          axios.get('http://localhost:4005/players/report', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:4005/coach/report', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:4005/games/report', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const playersList = playersRes.data.data || [];
        const coachesList = coachesRes.data.data || [];
        const gamesList = gamesRes.data.data || [];

        // Compute sums
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

        // Get last 4 players registered
        const sortedPlayers = [...playersList]
          .sort((a, b) => new Date(b.joiningDate || 0) - new Date(a.joiningDate || 0))
          .slice(0, 4);
        setRecentPlayers(sortedPlayers);

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        toast('Failed to load dashboard metrics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const cards = [
    {
      title: 'Total Players',
      value: stats.playersCount,
      icon: <FiUserCheck />,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/10',
      description: 'Active enrollments'
    },
    {
      title: 'Total Coaches',
      value: stats.coachesCount,
      icon: <FiUsers />,
      color: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/10',
      description: 'Academy instructors'
    },
    {
      title: 'Total Games',
      value: stats.gamesCount,
      icon: <FiAward />,
      color: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/10',
      description: 'Sports specialized'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: <FaRupeeSign />,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/10',
      description: 'Collected fee earnings'
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString('en-IN')}`,
      icon: <FaRupeeSign />,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/10',
      description: 'Awaiting collection'
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
              <div
                key={i}
                className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-lg ${card.shadow} flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-200`}
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
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Main Content Panel (Quick Actions & Recent Activity) */}
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
              to="/reportplayers"
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 group transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <FaRupeeSign className="text-lg" />
                </span>
                <div className="leading-tight">
                  <h4 className="text-sm font-bold text-gray-700">Fees Registry</h4>
                  <span className="text-[10px] text-gray-400">Track balance</span>
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

    </div>
  );
}
