// import { useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// import axios from "axios";

// function PlayerReport(){
//     // const navigate = useNavigate()
//     const[tasks,setTasks]=useState([]);
//     const token = localStorage.getItem('token');

//     useEffect(()=>{
//         const fetchtasks = async()=>{
//             try{
//                 const res = await axios.get('http://localhost:4005/players/report',{
//                     headers:{
//                         Authorization:`Bearer ${token}`
//                     }
//                 });

//                 setTasks(res.data.data);
//             } catch(err){
//                 alert('failed to  fetch players report ')
//             }
//         };
//         fetchtasks();
//     },[token]);

//     const Reportdelete=async(id)=>{
//   const rem = await fetch(`http://localhost:4005/players/delete/${id}`,{
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
            
//             <table border={2}>
//                 <thead>
//                     <tr>
//                         <th>Sr.no</th>
//                         <th>PlayerId</th>
//                         <th>FullName</th>
//                         <th>DateOfBirth</th>
//                         <th>Gender</th>
//                         <th>ContactNumber</th>
//                         <th>Email</th>
//                         <th>Address</th>
//                         <th>SportChosen</th>
//                         <th>CoachAssigned</th>
//                         <th>JoiningDate</th>
//                         <th>TotalFee</th>
//                         <th>PayingFee</th>
//                         <th>PendingFee</th>
//                         <th>Delete</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {tasks.map((s,i)=>(
//                         <tr key={i}>
//                             <td>{i+1}</td>
//                             <td>{s.playerId}</td>
//                             <td>{s.fullName}</td>
//                             <td>{s.dateOfBirth}</td>
//                             <td>{s.gender}</td>
//                             <td>{s.contactNumber}</td>
//                             <td>{s.email}</td>
//                             <td>{s.address}</td>
//                             <td>{s.sportChosen}</td>
//                             <td>{s.coachAssigned}</td>
//                             <td>{s.joiningDate}</td>
//                             <td>{s.totalFee}</td>
//                             <td>{s.payingFee}</td>
//                             <td>{s.pendingFee}</td>
//                              <td><button onClick={()=>Reportdelete(s._id)}>Delete</button></td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

// export default PlayerReport

import { useEffect, useState } from "react";
import axios from "axios";
import "../Style/Reportplayer.css";

function PlayerReport() {
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchtasks = async () => {
      try {
        const res = await axios.get("http://localhost:4005/players/report", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTasks(res.data.data);
      } catch (err) {
        alert("Failed to fetch players report");
      }
    };
    fetchtasks();
  }, [token]);

  const Reportdelete = async (id) => {
    const rem = await fetch(`http://localhost:4005/players/delete/${id}`, {
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
    <div className="playerreport-container">
      <h2 className="playerreport-title">Players Report</h2>
      <table className="playerreport-table">
        <thead>
          <tr>
            <th>Sr.no</th>
            <th>PlayerId</th>
            <th>FullName</th>
            <th>DateOfBirth</th>
            <th>Gender</th>
            <th>ContactNumber</th>
            <th>Email</th>
            <th>Address</th>
            <th>SportChosen</th>
            <th>CoachAssigned</th>
            <th>JoiningDate</th>
            <th>TotalFee</th>
            <th>PayingFee</th>
            <th>PendingFee</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((s, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{s.playerId}</td>
              <td>{s.fullName}</td>
              <td>{s.dateOfBirth}</td>
              <td>{s.gender}</td>
              <td>{s.contactNumber}</td>
              <td>{s.email}</td>
              <td>{s.address}</td>
              <td>{s.sportChosen}</td>
              <td>{s.coachAssigned}</td>
              <td>{s.joiningDate}</td>
              <td>{s.totalFee}</td>
              <td>{s.payingFee}</td>
              <td>{s.pendingFee}</td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => Reportdelete(s._id)}
                >
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

export default PlayerReport;
