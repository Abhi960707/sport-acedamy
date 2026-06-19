import { useState } from 'react';
import { useToast } from './Toast';
import '../Style/Games.css';

const INITIAL_STATE = {
  gameId: '',
  gameName: '',
  category: '',
  gameType: '',
  duration: '',
  gameFee: '',
};

function GameAdd() {
  const toast = useToast();
  const [addGame, setAddGame] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const handleGame = (e) => {
    setAddGame(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const gameSubmit = async (e) => {
    e.preventDefault();
    const { gameId, gameName, category, gameType, duration, gameFee } = addGame;
    if (!gameId || !gameName || !category || !gameType || !duration || !gameFee) {
      toast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/games/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addGame),
      });

      const result = await res.json();
      if (result.success) {
        toast('Game added successfully!', 'success');
        setAddGame(INITIAL_STATE);
      } else {
        toast(result.message || 'Failed to add game', 'error');
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
        {/* Header */}
        <div className="form-card__header">
          <span className="form-card__icon">🎮</span>
          <div>
            <h2 className="form-card__title">Add New Game</h2>
            <p className="form-card__sub">Register a new sport to the academy</p>
          </div>
        </div>

        <form className="form-body" onSubmit={gameSubmit} id="game-add-form" noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="game-id">Game ID</label>
              <input
                id="game-id"
                className="form-input"
                type="text"
                name="gameId"
                placeholder="e.g. G001"
                value={addGame.gameId}
                onChange={handleGame}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="game-name">Game Name</label>
              <input
                id="game-name"
                className="form-input"
                type="text"
                name="gameName"
                placeholder="e.g. Cricket"
                value={addGame.gameName}
                onChange={handleGame}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="game-category">Category</label>
              <select
                id="game-category"
                className="form-input form-select"
                name="category"
                value={addGame.category}
                onChange={handleGame}
                disabled={loading}
              >
                <option value="">Select Category</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="game-type">Game Type</label>
              <select
                id="game-type"
                className="form-input form-select"
                name="gameType"
                value={addGame.gameType}
                onChange={handleGame}
                disabled={loading}
              >
                <option value="">Select Type</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="game-duration">Duration</label>
              <input
                id="game-duration"
                className="form-input"
                type="text"
                name="duration"
                placeholder="e.g. 60 mins"
                value={addGame.duration}
                onChange={handleGame}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="game-fee">Game Fee (₹)</label>
              <input
                id="game-fee"
                className="form-input"
                type="number"
                name="gameFee"
                placeholder="e.g. 1500"
                value={addGame.gameFee}
                onChange={handleGame}
                disabled={loading}
                min="0"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              id="game-reset-btn"
              type="button"
              className="form-btn form-btn--secondary"
              onClick={() => setAddGame(INITIAL_STATE)}
              disabled={loading}
            >
              Reset
            </button>
            <button
              id="game-submit-btn"
              type="submit"
              className="form-btn form-btn--primary"
              disabled={loading}
            >
              {loading && <span className="loading-spinner" />}
              {loading ? 'Saving...' : 'Save Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameAdd;
