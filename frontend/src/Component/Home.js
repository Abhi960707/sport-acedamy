import { Link } from "react-router-dom";
import "../Style/Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <h1>Welcome To Sport Academy System</h1>
      <div className="nav-buttons">
        <Link to='/Games'><button>Games</button></Link>
        <Link to='/Coach'><button>Coach</button></Link>
        <Link to='/Player'><button>Player</button></Link>
        <Link to='/Reportgame'><button>Report Games</button></Link>
        <Link to='/Reportcoachs'><button>Report Coaches</button></Link>
        <Link to='/Reportplayers'><button>Report Players</button></Link>
      </div>
    </div>
  );
}
