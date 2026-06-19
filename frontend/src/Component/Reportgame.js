import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import '../Style/Reportgame.css';

function GameReport() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:4005/games/report', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data.data);
      } catch (err) {
        toast('Failed to fetch games report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    setDeletingId(id);
    try {
      const rem = await fetch(`http://localhost:4005/games/delete/${id}`, {
        method: 'DELETE',
      });
      const emp = await rem.json();
      if (emp.success) {
        // BUG FIX: update state instead of window.location.reload()
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Game deleted successfully', 'success');
      } else {
        toast('Failed to delete game', 'error');
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
          <span className="report-header__icon">📊</span>
          <div>
            <h2 className="report-header__title">Games Report</h2>
            <p className="report-header__sub">{tasks.length} game{tasks.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
      </div>

      <div className="report-table-wrap">
        {loading ? (
          <div className="report-loading">
            <span className="loading-spinner" style={{ width: 32, height: 32 }} />
            <span>Loading games...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="report-empty">
            <span className="report-empty__icon">🎮</span>
            <p>No games found. Add your first game!</p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Game ID</th>
                <th>Game Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Fee (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((p, i) => (
                <tr key={p._id} className={deletingId === p._id ? 'row--deleting' : ''}>
                  <td className="td--num">{i + 1}</td>
                  <td><span className="badge">{p.gameId}</span></td>
                  <td className="td--bold">{p.gameName}</td>
                  <td><span className={`tag tag--${p.category}`}>{p.category}</span></td>
                  <td><span className={`tag tag--${p.gameType}`}>{p.gameType}</span></td>
                  <td>{p.duration}</td>
                  <td className="td--fee">₹{p.gameFee}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      id={`delete-game-${p._id}`}
                    >
                      {deletingId === p._id ? '...' : '🗑 Delete'}
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

export default GameReport;
