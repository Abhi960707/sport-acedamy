// import { useState } from "react";
  

  
  
//   function CoachAdd(){
//       const [addCoach,setAddCoach]=useState({
//           coachId:'',
//           name:'',
//           sportSpecialization:'',
//           contact:'',
//           experience:''
        
//       })
  
//       const handleCoach = (e)=>{
//           setAddCoach({ ...addCoach,[e.target.name]:e.target.value})
//       }
  
//       const coachSubmit =async (s)=>{
//         s.preventDefault();
//         const token=localStorage.getItem("token")
//         console.log(token)
//         try{
          
//           const res = await fetch("http://localhost:4005/coach/add",{
//               method:"POST",
//               headers:{
//                   "Content-Type":"application/json",
//                   Authorization: `Bearer ${token}`
//               },
//               body:JSON.stringify(addCoach)
//           })
  
//           const result = await res.json();
//           console.log(result)
  
//           if(result.success){
//               alert("Coach add successful")
//           }
//           else{
//               alert("Coach not added")
//           }
//         }
//         catch(error){
//               alert("server error")
//         }
//       }



    
      
//   return(<>
//   <div>
//     <h2></h2>
//     <form onSubmit={coachSubmit}>
//     <label>CoachId</label><input type="text" name="coachId" value={addCoach.coachId}  onChange={handleCoach}></input>
//     <label>Name</label><input type="text" name="name" value={addCoach.name} onChange={handleCoach}></input>
//     <label>Sport Specilization</label> <input type="text" name="sportSpecialization" value={addCoach.sportSpecialization} onChange={handleCoach}></input> 
//     <label>Contact</label><input type="text" name="contact" value={addCoach.contact} onChange={handleCoach}></input>
//     <label>Experience</label><input type="text" name="experience" value={addCoach.experience} onChange={handleCoach}></input>
//     <button type="submit">Save</button>
// </form>
//   </div>
//   </>

//   );
// }
// export default CoachAdd
  
  
  
    
import { useState } from "react";
import "../Style/Coach.css";

function CoachAdd() {
  const [addCoach, setAddCoach] = useState({
    coachId: "",
    name: "",
    sportSpecialization: "",
    contact: "",
    experience: ""
  });

  const handleCoach = (e) => {
    setAddCoach({ ...addCoach, [e.target.name]: e.target.value });
  };

  const coachSubmit = async (s) => {
    s.preventDefault();
    const token = localStorage.getItem("token");
    console.log(token);
    try {
      const res = await fetch("http://localhost:4005/coach/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addCoach)
      });

      const result = await res.json();
      console.log(result);

      if (result.success) {
        alert("Coach add successful");
         setAddCoach({
          coachId: "",
          name: "",
          sportSpecialization: "",
          contact: "",
          experience: ""
        });
      } else {
        alert("Coach not added");
      }
    } catch (error) {
      alert("server error");
    }
  };

  return (
    <div className="coachadd-container">
      <form className="coachadd-form" onSubmit={coachSubmit}>
        <h2>Add New Coach</h2>

        <label>Coach ID</label>
        <input
          type="text"
          name="coachId"
          value={addCoach.coachId}
          onChange={handleCoach}
        />

        <label>Name</label>
        <input
          type="text"
          name="name"
          value={addCoach.name}
          onChange={handleCoach}
        />

        <label>Sport Specialization</label>
        <input
          type="text"
          name="sportSpecialization"
          value={addCoach.sportSpecialization}
          onChange={handleCoach}
        />

        <label>Contact</label>
        <input
          type="text"
          name="contact"
          value={addCoach.contact}
          onChange={handleCoach}
        />

        <label>Experience</label>
        <input
          type="text"
          name="experience"
          value={addCoach.experience}
          onChange={handleCoach}
        />

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default CoachAdd;
