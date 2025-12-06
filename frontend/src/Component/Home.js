// import { Link } from "react-router-dom"
// import '../Style/Home.css';
// export default function(){
    
//     return(
//         <div className="home-containe">
//         <h2>Welcome To Sport Acedamy System</h2>
//          <Link to='/Games'><button>Games</button></Link>
//          <Link to='/Coach'><button>Coach</button></Link>
//          <Link to='/Player'><button>Player</button></Link>
//          <Link to='/Reportgame'><button>Report games</button></Link>
//          <Link to='/Reportcoachs'><button>Report coachs</button></Link>
//          <Link to='/Reportplayers'><button>Report players</button></Link>
//         </div>
//     )

//     }

// import { Link } from "react-router-dom"
// import "../Style/Home.css"

// export default function Home(){
//   return(
//     <div className="home-container">
//       <h2>Welcome To Sport Academy System</h2>
//       <div className="button-group">
//         <Link to='/Games'><button>Games</button></Link>
//         <Link to='/Coach'><button>Coach</button></Link>
//         <Link to='/Player'><button>Player</button></Link>
//         <Link to='/Reportgame'><button>Report Games</button></Link>
//         <Link to='/Reportcoachs'><button>Report Coaches</button></Link>
//         <Link to='/Reportplayers'><button>Report Players</button></Link>
//       </div>
//     </div>
//   )
// }


import { Link } from "react-router-dom";
import "../Style/Home.css";   // CSS file import कर

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
