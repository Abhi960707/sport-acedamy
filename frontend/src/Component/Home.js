import { Link } from 'react-router-dom';
import '../Style/Home.css';
import sportsHeroImg from '../assets/sports-hero.jpg';

const DASHBOARD_CARDS = [
  {
    to: '/games',
    icon: '🎮',
    title: 'Games',
    description: 'Add and manage sports games, categories, types and fees',
    color: 'gold',
    id: 'card-games',
  },
  {
    to: '/coach',
    icon: '👤',
    title: 'Coaches',
    description: 'Register coaches, assign specializations and track experience',
    color: 'teal',
    id: 'card-coaches',
  },
  {
    to: '/player',
    icon: '🏃',
    title: 'Players',
    description: 'Enroll players, assign coaches and manage fees',
    color: 'gold',
    id: 'card-players',
  },
  {
    to: '/reportgame',
    icon: '📊',
    title: 'Game Reports',
    description: 'View and delete all registered games in the system',
    color: 'teal',
    id: 'card-report-games',
  },
  {
    to: '/reportcoachs',
    icon: '📋',
    title: 'Coach Reports',
    description: 'Browse all coach records and manage coach data',
    color: 'gold',
    id: 'card-report-coaches',
  },
  {
    to: '/reportplayers',
    icon: '📁',
    title: 'Player Reports',
    description: 'Full player registry with fee tracking and management',
    color: 'teal',
    id: 'card-report-players',
  },
];

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__bg" />
        <div className="home-hero__content">
          <div className="home-hero__badge">⚡ Management Dashboard</div>
          <h1 className="home-hero__title">
            Sport Academy
            <span className="home-hero__title-accent"> System</span>
          </h1>
          <p className="home-hero__subtitle">
            Manage your academy's games, coaches, and players from one powerful dashboard
          </p>
        </div>
        {/* Sports Image Banner */}
        <div className="home-hero__image-wrap">
          <img
            src={sportsHeroImg}
            alt="Sports equipment on grass field"
            className="home-hero__image"
          />
          <div className="home-hero__image-overlay" />
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="home-grid">
        <div className="home-grid__header">
          <h2 className="home-grid__title">Quick Access</h2>
          <p className="home-grid__sub">Select a module to get started</p>
        </div>
        <div className="home-grid__cards">
          {DASHBOARD_CARDS.map((card, i) => (
            <Link
              to={card.to}
              className={`home-card home-card--${card.color}`}
              key={card.to}
              id={card.id}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`home-card__icon-wrap home-card__icon-wrap--${card.color}`}>
                <span className="home-card__icon">{card.icon}</span>
              </div>
              <div className="home-card__body">
                <h3 className="home-card__title">{card.title}</h3>
                <p className="home-card__desc">{card.description}</p>
              </div>
              <span className="home-card__arrow">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
