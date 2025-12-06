// import { useState,useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from 'axios'
// function GameReport(){
//     const navigate = useNavigate()
//     const[tasks,setTasks]=useState([]);
//     const token = localStorage.getItem('token');

//     useEffect(() => {
//     const fetchtasks = async () => {
//       try {
//         const res = await axios.get('http://localhost:4005/games/report', {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });

//         setTasks(res.data.data);
//       } catch (err) {
//         alert('Failed to fetch games report');
//       }
//     };

//     fetchtasks();
// },[token]);

// const Gamedelete=async(id)=>{
//   const rem = await fetch(`http://localhost:4005/games/delete/${id}`,{
//     method:"DELETE"
//   })
//   const emp = await rem.json() 
  
//   if(emp.success){
//     alert("deleted")
//     window.location.reload()
//   }
//   else{
//     alert("not deleted")
//   }
// }
    
//     return(
//         <div>
//             <h1></h1>
//             <table border={2}> 
//                 <thead>
//                     <tr>
//                         <th>Sr.no</th>
//                     <th>GameId</th>
//                     <th>GameName</th>
//                     <th>Category</th>
//                     <th>GameType</th>
//                     <th>Duration</th>
//                     <th>GameFee</th>
//                     <th>Delete</th>

//                   </tr>                
//                 </thead>
//                <tbody>
//           {tasks.map((p, i) => (
//             <tr key={i}>
//               <td>{i+1}</td>
//               <td>{p.gameId}</td>
//               <td>{p.gameName}</td>
//               <td>{p.category}</td>
//               <td>{p.gameType}</td>
//               <td>{p.duration}</td>
//               <td>{p.gameFee}</td>
//               <td><button onClick={()=>Gamedelete(p._id)}>Delete</button></td>
//            </tr>
//           ))}
//         </tbody>
//             </table>

//         </div>
//     );
// }

// export default GameReport

import { useState, useEffect } from "react";
import axios from "axios";
import "../Style/Reportgame.css";

function GameReport() {
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchtasks = async () => {
      try {
        const res = await axios.get("http://localhost:4005/games/report", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTasks(res.data.data);
      } catch (err) {
        alert("Failed to fetch games report");
      }
    };

    fetchtasks();
  }, [token]);

  const Gamedelete = async (id) => {
    const rem = await fetch(`http://localhost:4005/games/delete/${id}`, {
      method: "DELETE",
    });
    const emp = await rem.json();

    if (emp.success) {
      alert("Deleted");
      window.location.reload();
    } else {
      alert("Not deleted");
    }
  };

  return (
    <div className="gamereport-container">
      <h2 className="gamereport-title">Games Report</h2>
      <table className="gamereport-table">
        <thead>
          <tr>
            <th>Sr.no</th>
            <th>GameId</th>
            <th>GameName</th>
            <th>Category</th>
            <th>GameType</th>
            <th>Duration</th>
            <th>GameFee</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{p.gameId}</td>
              <td>{p.gameName}</td>
              <td>{p.category}</td>
              <td>{p.gameType}</td>
              <td>{p.duration}</td>
              <td>{p.gameFee}</td>
              <td>
                <button className="delete-btn" onClick={() => Gamedelete(p._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GameReport;
