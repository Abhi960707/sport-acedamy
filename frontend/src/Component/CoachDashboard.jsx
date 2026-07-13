import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { FiUsers, FiAward, FiCheckCircle, FiXCircle, FiActivity } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useToast } from './Toast';

export default function CoachDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState({
    playersCount: 0,
    gamesCount: 0,
    totalRevenue: 0,
    pendingFees: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        const [playersRes, gamesRes, attendanceRes] = await Promise.all([
          api.get('/players/report'),
          api.get('/games/report'),
          api.get('/attendance/report'),
        ]);

        if (controller.signal.aborted) return;

        let playersList = playersRes.data.data || [];
        const gamesList = gamesRes.data.data || [];
        let attendanceList = attendanceRes.data.data || [];

        const authUserStr = localStorage.getItem('authUser');
        if (authUserStr) {
          try {
            const authUser = JSON.parse(authUserStr);
            if (authUser.role === 'coach') {
              playersList = playersList.filter(p => p.coachAssigned === authUser.name);
              const myPlayerNames = playersList.map(p => p.fullName);
              attendanceList = attendanceList.filter(a => myPlayerNames.includes(a.playerName));
            }
          } catch(e) {}
        }

        let revenue = 0;
        let pending = 0;
        playersList.forEach(p => {
          revenue += parseFloat(p.payingFee) || 0;
          pending += parseFloat(p.pendingFee) || 0;
        });

        const today = new Date().toISOString().slice(0, 10);
        const todaysAttendance = attendanceList.filter(a => a.attendanceDate === today);
        const presentToday = todaysAttendance.filter(a => ['present', 'late'].includes(a.status)).length;
        const absentToday = todaysAttendance.filter(a => ['absent', 'excused'].includes(a.status)).length;

        setStats({
          playersCount: playersList.length,
          gamesCount: gamesList.length,
          totalRevenue: revenue,
          pendingFees: pending,
          presentToday,
          absentToday
        });

        const sortedPlayers = [...playersList]
          .sort((a, b) => new Date(b.joiningDate || 0) - new Date(a.joiningDate || 0))
          .slice(0, 5);
        setRecentPlayers(sortedPlayers);

        const sortedAttendance = [...attendanceList]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
        setRecentAttendance(sortedAttendance);

      } catch (err) {
        if (controller.signal.aborted) return;
        toast('Failed to load dashboard metrics', 'error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, [toast]);

  const cards = [
    {
      title: 'My Players',
      value: stats.playersCount,
      icon: <FiUsers />,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/10',
      description: 'Assigned to you',
      link: '/reportplayers'
    },
    {
      title: 'My Games',
      value: stats.gamesCount,
      icon: <FiAward />,
      color: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/10',
      description: 'Your sport specialization',
      link: '/reportgame'
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: <FiCheckCircle />,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/10',
      description: 'Marked present',
      link: `/attendance?query=present ${new Date().toISOString().slice(0, 10)}`
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: <FiXCircle />,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/10',
      description: 'Marked absent',
      link: `/attendance?query=absent ${new Date().toISOString().slice(0, 10)}`
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString('en-IN')}`,
      icon: <FaRupeeSign />,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/10',
      description: 'Awaiting collection',
      link: '/reportplayers?query=pending'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100">
            🏃‍♂️ Coach Dashboard
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
            Your Coaching Hub
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Manage your assigned players, mark attendance, track fee payments, and view your sports schedule instantly.
          </p>
        </div>
      </section>

      {/* Metrics Statistics Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-800">Your Overview</h2>
          <p className="text-xs text-gray-500">Live operational data for your assigned players</p>
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

      {/* Activity & Lists */}
      <section className="grid lg:grid-cols-2 gap-6">
        {/* Recent Players */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FiUsers className="text-indigo-500" /> Newest Players
              </h3>
              <p className="text-[10px] text-gray-400">Recently assigned to you</p>
            </div>
            <Link to="/reportplayers" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
               <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            ) : recentPlayers.length === 0 ? (
               <div className="text-xs text-gray-400 text-center py-4">No players assigned yet.</div>
            ) : (
               recentPlayers.map(player => (
                 <div key={player._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-gray-100/50">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{player.fullName}</h4>
                      <p className="text-[10px] text-gray-500">{player.playerId} • {player.sportChosen}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      parseFloat(player.pendingFee) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {parseFloat(player.pendingFee) > 0 ? 'Fee Due' : 'Paid'}
                    </span>
                 </div>
               ))
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FiActivity className="text-teal-500" /> Recent Attendance
              </h3>
              <p className="text-[10px] text-gray-400">Latest records logged</p>
            </div>
            <Link to="/attendance" className="text-xs font-bold text-teal-600 hover:text-teal-700">Mark Attendance</Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
               <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            ) : recentAttendance.length === 0 ? (
               <div className="text-xs text-gray-400 text-center py-4">No attendance records today.</div>
            ) : (
               recentAttendance.map(record => (
                 <div key={record._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-gray-100/50">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{record.playerName}</h4>
                      <p className="text-[10px] text-gray-500">{record.attendanceDate}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
                      record.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                      record.status === 'absent' ? 'bg-rose-50 text-rose-600' :
                      record.status === 'late' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {record.status === 'present' ? <FiCheckCircle /> : <FiXCircle />}
                      {record.status}
                    </span>
                 </div>
               ))
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
