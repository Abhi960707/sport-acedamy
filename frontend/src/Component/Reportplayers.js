import { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import '../Style/Reportplayer.css';

function PlayerReport() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:4005/players/report', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data.data);
      } catch (err) {
        toast('Failed to fetch players report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    setDeletingId(id);
    try {
      const rem = await fetch(`http://localhost:4005/players/delete/${id}`, {
        method: 'DELETE',
      });
      const emp = await rem.json();
      if (emp.success) {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Player deleted successfully', 'success');
      } else {
        toast('Failed to delete player', 'error');
      }
    } catch {
      toast('Server error during deletion', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-header__left">
          <span className="report-header__icon">📁</span>
          <div>
            <h2 className="report-header__title">Players Report</h2>
            <p className="report-header__sub">{tasks.length} player{tasks.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
      </div>

      <div className="report-table-wrap report-table-wrap--scroll">
        {loading ? (
          <div className="report-loading">
            <span className="loading-spinner" style={{ width: 32, height: 32 }} />
            <span>Loading players...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="report-empty">
            <span className="report-empty__icon">🏃</span>
            <p>No players found. Add your first player!</p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player ID</th>
                <th>Full Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Address</th>
                <th>Sport</th>
                <th>Coach</th>
                <th>Joining Date</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((s, i) => (
                <tr key={s._id} className={deletingId === s._id ? 'row--deleting' : ''}>
                  <td className="td--num">{i + 1}</td>
                  <td><span className="badge">{s.playerId}</span></td>
                  <td className="td--bold">{s.fullName}</td>
                  <td>{s.dateOfBirth}</td>
                  <td><span className={`tag tag--${s.gender}`}>{s.gender}</span></td>
                  <td>{s.contactNumber}</td>
                  <td>{s.email}</td>
                  <td>{s.address}</td>
                  <td><span className="tag tag--single">{s.sportChosen}</span></td>
                  <td>{s.coachAssigned}</td>
                  <td>{s.joiningDate}</td>
                  <td className="td--fee">₹{s.totalFee}</td>
                  <td className="td--paid">₹{s.payingFee}</td>
                  <td className={`td--pending${Number(s.pendingFee) > 0 ? ' td--danger' : ''}`}>
                    ₹{s.pendingFee}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(s._id)}
                      disabled={deletingId === s._id}
                      id={`delete-player-${s._id}`}
                    >
                      {deletingId === s._id ? '...' : '🗑 Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PlayerReport;
