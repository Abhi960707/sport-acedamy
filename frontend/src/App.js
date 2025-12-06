import { Navigate,Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './Component/Home'
import Login from './Component/Login'
import Signup from './Component/Signup'
import Games from './Component/Games'
import Coach from './Component/Coach'
import Player from './Component/Player'
import Reportgame from './Component/Reportgame'
import { useState } from 'react'
import Reportcoachs from './Component/Reportcoachs'
import Reportplayers from './Component/Reportplayers'

function App() {
  const [token, setToken]=useState(localStorage.getItem("token"))

  useState(()=>{
    if(token){
      localStorage.setItem("token", token)
    }
    else{
      localStorage.removeItem("token")
    }
  }, [token])

  return (
    <div className="App">
      <Routes>
        
          <Route path='/' element={<Navigate to="/login" />}></Route>
          <Route path='/login' element={<Login setToken={setToken}></Login>}></Route>
          <Route path='/signup' element={<Signup></Signup>}></Route>
          <Route path='/home' element={<Home></Home>}></Route>
          <Route path='/games' element={<Games></Games>}></Route>
          <Route path='/coach' element={<Coach></Coach>}></Route>
          <Route path='/player' element={<Player></Player>}></Route>
          <Route path='/reportgame' element={<Reportgame></Reportgame>}></Route>
          <Route path='/reportcoachs' element={<Reportcoachs></Reportcoachs>}></Route>
          <Route path='/reportplayers' element={<Reportplayers></Reportplayers>}></Route>
          
          
          </Routes>
    </div>
  );
}

export default App;
