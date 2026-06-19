import { useState } from 'react';
import { useToast } from './Toast';
import '../Style/Player.css';

const INITIAL_STATE = {
  playerId: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  contactNumber: '',
  email: '',
  address: '',
  sportChosen: '',
  coachAssigned: '',
  joiningDate: '',
  totalFee: '',
  payingFee: '',
  pendingFee: '',
};

function PlayerAdd() {
  const toast = useToast();
  const [addPlayers, setAddPlayers] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const handlePlayers = (e) => {
    setAddPlayers(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const playersSubmit = async (e) => {
    e.preventDefault();
    const { playerId, fullName, dateOfBirth, gender, contactNumber, email } = addPlayers;
    if (!playerId || !fullName || !dateOfBirth || !gender || !contactNumber || !email) {
      toast('Please fill in all required fields', 'warning');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/players/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addPlayers),
      });

      const result = await res.json();
      if (result.success) {
        toast('Player added successfully!', 'success');
        setAddPlayers(INITIAL_STATE);
      } else {
        toast(result.message || 'Failed to add player', 'error');
      }
    } catch (error) {
      toast('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card form-card--wide">
        <div className="form-card__header">
          <span className="form-card__icon">🏃</span>
          <div>
            <h2 className="form-card__title">Add New Player</h2>
            <p className="form-card__sub">Enroll a new player in the academy</p>
          </div>
        </div>

        <form className="form-body" onSubmit={playersSubmit} id="player-add-form" noValidate>
          {/* Section: Personal Info */}
          <div className="form-section-label">Personal Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="player-id">Player ID</label>
              <input id="player-id" className="form-input" type="text" name="playerId"
                placeholder="e.g. P001" value={addPlayers.playerId} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-name">Full Name</label>
              <input id="player-name" className="form-input" type="text" name="fullName"
                placeholder="Player's full name" value={addPlayers.fullName} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-dob">Date of Birth</label>
              <input id="player-dob" className="form-input" type="date" name="dateOfBirth"
                value={addPlayers.dateOfBirth} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-gender">Gender</label>
              <select id="player-gender" className="form-input form-select" name="gender"
                value={addPlayers.gender} onChange={handlePlayers} disabled={loading}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-contact">Contact Number</label>
              <input id="player-contact" className="form-input" type="number" name="contactNumber"
                placeholder="10-digit number" value={addPlayers.contactNumber} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-email">Email</label>
              <input id="player-email" className="form-input" type="email" name="email"
                placeholder="player@email.com" value={addPlayers.email} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="player-address">Address</label>
              <input id="player-address" className="form-input" type="text" name="address"
                placeholder="Full address" value={addPlayers.address} onChange={handlePlayers} disabled={loading} />
            </div>
          </div>

          {/* Section: Academy Info */}
          <div className="form-section-label">Academy Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="player-sport">Sport Chosen</label>
              <select id="player-sport" className="form-input form-select" name="sportChosen"
                value={addPlayers.sportChosen} onChange={handlePlayers} disabled={loading}>
                <option value="">Select Sport</option>
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Kho Kho">Kho Kho</option>
                <option value="Chess">Chess</option>
                <option value="Carrom">Carrom</option>
                <option value="Kabbadi">Kabbadi</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-coach">Coach Assigned</label>
              <input id="player-coach" className="form-input" type="text" name="coachAssigned"
                placeholder="Coach name" value={addPlayers.coachAssigned} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-joining">Joining Date</label>
              <input id="player-joining" className="form-input" type="date" name="joiningDate"
                value={addPlayers.joiningDate} onChange={handlePlayers} disabled={loading} />
            </div>
          </div>

          {/* Section: Fee Info */}
          <div className="form-section-label">Fee Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="player-totalfee">Total Fee (₹)</label>
              <input id="player-totalfee" className="form-input" type="text" name="totalFee"
                placeholder="0.00" value={addPlayers.totalFee} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-paying">Paying Fee (₹)</label>
              <input id="player-paying" className="form-input" type="text" name="payingFee"
                placeholder="0.00" value={addPlayers.payingFee} onChange={handlePlayers} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player-pending">Pending Fee (₹)</label>
              <input id="player-pending" className="form-input" type="text" name="pendingFee"
                placeholder="0.00" value={addPlayers.pendingFee} onChange={handlePlayers} disabled={loading} />
            </div>
          </div>

          <div className="form-actions">
            <button id="player-reset-btn" type="button" className="form-btn form-btn--secondary"
              onClick={() => setAddPlayers(INITIAL_STATE)} disabled={loading}>
              Reset
            </button>
            <button id="player-submit-btn" type="submit" className="form-btn form-btn--primary" disabled={loading}>
              {loading && <span className="loading-spinner" />}
              {loading ? 'Saving...' : 'Save Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlayerAdd;
