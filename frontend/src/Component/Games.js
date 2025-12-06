// import { useState } from "react";

// function GameAdd(){
//     const [addGame,setAddGame]=useState({
//         gameId:'',
//         gameName:'',
//         category:'',
//         gameType:'',
//         duration:'',
//         gameFee:''
//     })

//     const handleGame = (e)=>{
//         setAddGame({ ...addGame,[e.target.name]:e.target.value})
//     }

//     const gameSubmit =async (s)=>{
//       s.preventDefault();
//       const token=localStorage.getItem("token")
//       console.log(token)
//       try{
        
//         const res = await fetch("http://localhost:4005/games/add",{
//             method:"POST",
//             headers:{
//                 "Content-Type":"application/json",
//                 Authorization: `Bearer ${token}`
//             },
//             body:JSON.stringify(addGame)
//         })

//         const result = await res.json();
//         console.log(result)

//         if(result.success){
//             alert("game add successful")
//         }
//         else{
//             alert("game not added")
//         }
//       }
//       catch(error){
//             alert("server error")
//       }
//     }
//     return(<>
        
//         <div>
//        <h2>omka</h2> 
//        <form onSubmit={gameSubmit}>
//         <label>Game Id</label><input type="text" name="gameId" value={addGame.gameId} onChange={handleGame}></input>
//         <label>Game Name</label><input type="text" name="gameName" value={addGame.gameName} onChange={handleGame}></input>
//        <label>Category</label>
//        <select name="category" value={addGame.category} onChange={handleGame}> 
//         <option>Select</option>
//         <option value="single">Single</option>
//         <option value="double">Double</option> 
//         <option value="team">Team</option>       
//        </select>
//        <label>GameType</label>
//        <select name="gameType" value={addGame.gameType} onChange={handleGame}>
//         <option>Select</option> 
//         <option value="indoor">Indoor</option>
//         <option value="outdoor">Outdoor</option>                       
//          </select>
//          <label>Duration</label><input type="text" name="duration" value={addGame.duration} onChange={handleGame}></input>
//          <label>Game Fee</label><input type="number" name="gameFee" value={addGame.gameFee} onChange={handleGame}></input>
//          <button type="submit">Save</button>

//        </form>
//         </div>
//         </>
//     );
// }
//  export default GameAdd
import { useState } from "react";
import "../Style/Games.css";

function GameAdd() {
  const [addGame, setAddGame] = useState({
    gameId: "",
    gameName: "",
    category: "",
    gameType: "",
    duration: "",
    gameFee: ""
  });

  const handleGame = (e) => {
    setAddGame({ ...addGame, [e.target.name]: e.target.value });
  };

  const gameSubmit = async (s) => {
    s.preventDefault();
    const token = localStorage.getItem("token");
    console.log(token);
    try {
      const res = await fetch("http://localhost:4005/games/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addGame)
      });

      const result = await res.json();
      console.log(result);

      if (result.success) {
        alert("game add successful");
        setAddGame({
          gameId: "",
          gameName: "",
          category: "",
          gameType: "",
          duration: "",
          gameFee: "" //
        });
      } else {
        alert("game not added");
      }
    } catch (error) {
      alert("server error");
    }
  };

  return (
    <div className="gameadd-container">
      <form className="gameadd-form" onSubmit={gameSubmit}>
        <h2>Add New Game</h2>

        <label>Game Id</label>
        <input
          type="text"
          name="gameId"
          value={addGame.gameId}
          onChange={handleGame}
        />

        <label>Game Name</label>
        <input
          type="text"
          name="gameName"
          value={addGame.gameName}
          onChange={handleGame}
        />

        <label>Category</label>
        <select name="category" value={addGame.category} onChange={handleGame}>
          <option value="">Select</option>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="team">Team</option>
        </select>

        <label>Game Type</label>
        <select name="gameType" value={addGame.gameType} onChange={handleGame}>
          <option value="">Select</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>

        <label>Duration</label>
        <input
          type="text"
          name="duration"
          value={addGame.duration}
          onChange={handleGame}
        />

        <label>Game Fee</label>
        <input
          type="number"
          name="gameFee"
          value={addGame.gameFee}
          onChange={handleGame}
        />

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default GameAdd;
