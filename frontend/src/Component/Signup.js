import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../Style/Signup.css';

function Signup() {

  const navigate = useNavigate()
  const [signupInfo, setSignupInfo]=useState({
    name:'',
    email:'',
    password:''
  })

  const handleChange = (e) => {
    const {name, value } = e.target
    // console.log(name,value )
    const copySignupInfo = { ...signupInfo}
    copySignupInfo[name] = value
    setSignupInfo(copySignupInfo)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const {name, email, password} = signupInfo
    if(!name || !email || !password){
      alert('name, email and password are required')
    }
    try{
      const url = "https://sport-acedamy-backend.onrender.com/login/signup"
      const response = await fetch(url,{
      method:"post",
      headers :{
        'Content-Type':'application/json'
      },
      body:JSON.stringify(signupInfo)
    })

    const result = await response.json()
    const { success, error } = result
    if(success){
      alert('signup successfull')
      navigate('/Login')
    }
    else if(error){
      alert('signup fail',error)
      
      
    }
    else if(!success){
     alert('server erroe')
    }

  }
    catch(e){
      console.log("error",e)
    }
  }


  return (
    <div className='container'>
      
      <form onSubmit={handleSignup}>
        <div>
          <label htmlFor="name">Name</label>
          <input type="text"
                  onChange={handleChange}
                  name='name'
                  autoFocus
                  placeholder='enter your name...'
                  value={signupInfo.name}
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email"
                  onChange={handleChange}
                  name='email'
                  placeholder='enter your email...'
                  value={signupInfo.email}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password"
                  onChange={handleChange}
                  name='password'
                  placeholder='enter your password...'
                  value={signupInfo.password}
          />
        </div>
        <button type='submit'>Signup</button>
        <span>already have an account ?
          <Link to='/login'>Login</Link>
        </span>
      </form>
    </div>
  )
}

export default Signup
