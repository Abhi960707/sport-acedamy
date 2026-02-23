import React, { useState } from 'react'
import "../Style/Login.css"
import { Link } from 'react-router-dom'

import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
    const [login, setLogin]=useState({
        email:'',
        password:''
    })

    const handleChange = (e) => {
        const {name, value} = e.target
        const copyLogin = { ...login}
        copyLogin[name] = value
        setLogin(copyLogin)
    }

    const handleLogin = async (e) => {
  e.preventDefault();

  const { email, password } = login;

  if (!email) {
    alert("Email is required");
    return;
  }

  if (!password) {
    alert("Password is required");
    return;
  }

  try {
    const url = "https://sport-acedamy-1.onrender.com/login/login";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(login),
    });

    const result = await response.json();
    const { success, token, message } = result;

    if (success) {
      localStorage.setItem("token", token);
      alert("Login successful");
      navigate("/Home");
    } else {
      alert(message || "Wrong email or password");
    }
  } catch (error) {
    console.log("Login error:", error);
    alert("Server not responding");
  }
};

    
    
  return (
    <div className='container'>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email *</label>
          <input type="email"
                    onChange={handleChange}
                    name='email'
                    placeholder='Enter your email...'
                    value={login.email}
          />
        </div>
        <div>
          <label htmlFor="password">Password *</label>
          <input type="password"
                    onChange={handleChange}
                    name='password'
                    placeholder='Enter your password...'
                    value={login.password}
          />
        </div>
        <button type='submit'>Login</button>
        <span>
              Don't have an account ? <Link to='/Signup'>Signup</Link>
        </span>
      </form>
      
    </div>     
  )
}

export default Login
