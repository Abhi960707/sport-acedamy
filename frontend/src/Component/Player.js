import { useState } from "react";
import "../Style/Player.css";

function PlayerAdd() {
  const [addPlayers, setAddPlayers] = useState({
    playerId: "",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    email: "",
    address: "",
    sportChosen: "",
    coachAssigned: "",
    joiningDate: "",
    totalFee: "",
    payingFee: "",
    pendingFee: ""
  });

  const handlePlayers = (e) => {
    setAddPlayers({ ...addPlayers, [e.target.name]: e.target.value });
  };

  const playersSubmit = async (s) => {
    s.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4005/players/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addPlayers)
      });

      const result = await res.json();
      if (result.success) {
        alert("Player added successfully");
         setAddPlayers({
          playerId: "",
          fullName: "",
          dateOfBirth: "",
          gender: "",
          contactNumber: "",
          email: "",
          address: "",
          sportChosen: "",
          coachAssigned: "",
          joiningDate: "",
          totalFee: "",
          payingFee: "",
          pendingFee: ""
        });
      } else {
        alert("Player not added");
      }
    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <div className="playeradd-container">
      <form className="playeradd-form" onSubmit={playersSubmit}>
        <h2>Add New Player</h2>

        <label>Player ID</label>
        <input
          type="text"
          name="playerId"
          value={addPlayers.playerId}
          onChange={handlePlayers}
        />

        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={addPlayers.fullName}
          onChange={handlePlayers}
        />

        <label>Date of Birth</label>
        <input
          type="date"
          name="dateOfBirth"
          value={addPlayers.dateOfBirth}
          onChange={handlePlayers}
        />

        <label>Gender</label>
        <select
          name="gender"
          value={addPlayers.gender}
          onChange={handlePlayers}
        >
          <option>Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <label>Phone No</label>
        <input
          type="number"
          name="contactNumber"
          value={addPlayers.contactNumber}
          onChange={handlePlayers}
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={addPlayers.email}
          onChange={handlePlayers}
        />

        <label>Address</label>
        <input
          type="text"
          name="address"
          value={addPlayers.address}
          onChange={handlePlayers}
        />

       <label>Sport Choosen</label>
        <select
          name="sportChosen"
          value={addPlayers.sportChosen}
          onChange={handlePlayers}
        >
          <option>Select</option>
          <option value="Cricket">Cricket</option>
          <option value="Football">Football</option>
          <option value="Kho Kho">Kho Kho</option>
          <option value="Chess">Chess</option>
          <option value="Carrom">Carrom</option>
          <option value="Kabbadi">Kabbadi</option>
        </select>

        <label>Coach Assigned</label>
        <input
          type="text"
          name="coachAssigned"
          value={addPlayers.coachAssigned}
          onChange={handlePlayers}
        />

        <label>Joining Date</label>
        <input
          type="date"
          name="joiningDate"
          value={addPlayers.joiningDate}
          onChange={handlePlayers}
        />

        <label>Total Fee</label>
        <input
          type="text"
          name="totalFee"
          value={addPlayers.totalFee}
          onChange={handlePlayers}
        />

        <label>Paying Fee</label>
        <input
          type="text"
          name="payingFee"
          value={addPlayers.payingFee}
          onChange={handlePlayers}
        />

        <label>Pending Fee</label>
        <input
          type="text"
          name="pendingFee"
          value={addPlayers.pendingFee}
          onChange={handlePlayers}
        />

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default PlayerAdd;
