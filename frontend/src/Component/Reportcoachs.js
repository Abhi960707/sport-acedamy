// import { useState,useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// import axios from 'axios'
// function CoachReport(){
//     // const navigate = useNavigate()
//     const[tasks,setTasks]=useState([]);
//     const token = localStorage.getItem('token');

//     useEffect(() => {
//     const fetchtasks = async () => {
//       try {
//         const res = await axios.get('http://localhost:4005/coach/report', {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });

//         setTasks(res.data.data);
//       } catch (err) {
//         alert('Failed to fetch farmer report');
//       }
//     };

//     fetchtasks();
// },[token]);

//     const Coachdelete=async(id)=>{
//   const rem = await fetch(`http://localhost:4005/coach/delete/${id}`,{
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
//                     <th>CoachId</th>
//                     <th>Name</th>
//                     <th>Sport Specilization</th>
//                     <th>Contact</th>
//                     <th>Experience</th>
//                     <th>Delete</th>

//                   </tr>                
//                 </thead>
//                <tbody>
//           {tasks.map((p, i) => (
//             <tr key={i}>
//               <td>{i+1}</td>
//               <td>{p.coachId}</td>
//               <td>{p.name}</td>
//               <td>{p.sportSpecialization}</td>
//               <td>{p.contact}</td>
//               <td>{p.experience}</td>
//               <td><button onClick={()=>Coachdelete(p._id)}>Delete</button></td>
            
//            </tr>
//           ))}
//         </tbody>
//             </table>

//         </div>
//     );
// }

// export default CoachReport


import { useState, useEffect } from "react";
import axios from "axios";
import "../Style/Reportcoach.css";

function CoachReport() {
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchtasks = async () => {
      try {
        const res = await axios.get("http://localhost:4005/coach/report", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTasks(res.data.data);
      } catch (err) {
        alert("Failed to fetch coach report");
      }
    };

    fetchtasks();
  }, [token]);

  const Coachdelete = async (id) => {
    const rem = await fetch(`http://localhost:4005/coach/delete/${id}`, {
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
    <div className="coachreport-container">
      <h2 className="coachreport-title">Coach Report</h2>
      <table className="coachreport-table">
        <thead>
          <tr>
            <th>Sr.no</th>
            <th>CoachId</th>
            <th>Name</th>
            <th>Sport Specialization</th>
            <th>Contact</th>
            <th>Experience</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{p.coachId}</td>
              <td>{p.name}</td>
              <td>{p.sportSpecialization}</td>
              <td>{p.contact}</td>
              <td>{p.experience}</td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => Coachdelete(p._id)}
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

export default CoachReport;
