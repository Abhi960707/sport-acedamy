import { useState } from 'react';
import { useToast } from './Toast';
import '../Style/Coach.css';

const INITIAL_STATE = {
  coachId: '',
  name: '',
  middlename: '',
  sportSpecialization: '',
  contact: '',
  experience: '',
};

function CoachAdd() {
  const toast = useToast();
  const [addCoach, setAddCoach] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const handleCoach = (e) => {
    setAddCoach(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const coachSubmit = async (e) => {
    e.preventDefault();
    const { coachId, name, sportSpecialization, contact, experience,middlename } = addCoach;
    if (!coachId || !name || !sportSpecialization || !contact || !experience || !middlename) {
      toast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/coach/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addCoach),
      });

      const result = await res.json();
      if (result.success) {
        toast('Coach added successfully!', 'success');
        setAddCoach(INITIAL_STATE);
      } else {
        toast(result.message || 'Failed to add coach', 'error');
      }
    } catch (error) {
      toast('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon">👤</span>
          <div>
            <h2 className="form-card__title">Add New Coach</h2>
            <p className="form-card__sub">Register a coach to the academy</p>
          </div>
        </div>

        <form className="form-body" onSubmit={coachSubmit} id="coach-add-form" noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="coach-id">Coach ID</label>
              <input
                id="coach-id"
                className="form-input"
                type="text"
                name="coachId"
                placeholder="e.g. C001"
                value={addCoach.coachId}
                onChange={handleCoach}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="coach-name">Full Name</label>
              <input
                id="coach-name"
                className="form-input"
                type="text"
                name="name"
                placeholder="Coach full name"
                value={addCoach.name}
                onChange={handleCoach}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="coach-middlename">Middle Name</label>
              <input
                id="coach-middlename"
                className="form-input"
                type="text"
                name="middlename"
                placeholder="Coach Middle name"
                value={addCoach.middlename}
                onChange={handleCoach}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="coach-sport">Sport Specialization</label>
              <input
                id="coach-sport"
                className="form-input"
                type="text"
                name="sportSpecialization"
                placeholder="e.g. Cricket"
                value={addCoach.sportSpecialization}
                onChange={handleCoach}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="coach-contact">Contact Number</label>
              <input
                id="coach-contact"
                className="form-input"
                type="text"
                name="contact"
                placeholder="e.g. 9876543210"
                value={addCoach.contact}
                onChange={handleCoach}
                disabled={loading}
              />
            </div>

            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="coach-exp">Experience</label>
              <input
                id="coach-exp"
                className="form-input"
                type="text"
                name="experience"
                placeholder="e.g. 5 years"
                value={addCoach.experience}
                onChange={handleCoach}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              id="coach-reset-btn"
              type="button"
              className="form-btn form-btn--secondary"
              onClick={() => setAddCoach(INITIAL_STATE)}
              disabled={loading}
            >
              Reset
            </button>
            <button
              id="coach-submit-btn"
              type="submit"
              className="form-btn form-btn--primary"
              disabled={loading}
            >
              {loading && <span className="loading-spinner" />}
              {loading ? 'Saving...' : 'Save Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CoachAdd;
