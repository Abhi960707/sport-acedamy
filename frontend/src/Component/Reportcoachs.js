import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import '../Style/Reportcoach.css';

function CoachReport() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:4005/coach/report', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data.data);
      } catch (err) {
        toast('Failed to fetch coach report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coach?')) return;
    setDeletingId(id);
    try {
      const rem = await fetch(`http://localhost:4005/coach/delete/${id}`, {
        method: 'DELETE',
      });
      const emp = await rem.json();
      if (emp.success) {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast('Coach deleted successfully', 'success');
      } else {
        toast('Failed to delete coach', 'error');
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
          <span className="report-header__icon">📋</span>
          <div>
            <h2 className="report-header__title">Coach Report</h2>
            <p className="report-header__sub">{tasks.length} coach{tasks.length !== 1 ? 'es' : ''} registered</p>
          </div>
        </div>
      </div>

      <div className="report-table-wrap">
        {loading ? (
          <div className="report-loading">
            <span className="loading-spinner" style={{ width: 32, height: 32 }} />
            <span>Loading coaches...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="report-empty">
            <span className="report-empty__icon">👤</span>
            <p>No coaches found. Add your first coach!</p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Coach ID</th>
                <th>Name</th>
                <th>Middle Name</th>
                <th>Sport Specialization</th>
                <th>Contact</th>
                <th>Experience</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((p, i) => (
                <tr key={p._id} className={deletingId === p._id ? 'row--deleting' : ''}>
                  <td className="td--num">{i + 1}</td>
                  <td><span className="badge">{p.coachId}</span></td>
                  <td className="td--bold">{p.name}</td>
                  <td className="td--bold">{p.middlename}</td>
                  <td><span className="tag tag--single">{p.sportSpecialization}</span></td>
                  <td>{p.contact}</td>
                  <td>{p.experience}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      id={`delete-coach-${p._id}`}
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

export default CoachReport;
