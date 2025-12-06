import React, { useState } from 'react'

import { Link } from 'react-router-dom'

import { useNavigate } from 'react-router-dom'

import '../Style/Login.css';

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
        e.preventDefault()
        const {email, password} = login
        if(!email){
           alert('Email is wrong')
        }
        if(!password){
            alert('password is required...')
        }
        try{
              const url = "http://localhost:4005/login/login"
              const response = await fetch(url,{
              method:"post",
              headers :{
                'Content-Type':'application/json'
              },
              body:JSON.stringify(login)
            })
        
            const result = await response.json()
            const { success, token } = result
            if(success){
              localStorage.setItem('token', token)
           alert('login successfull')
              navigate('/Home')
            }
            else{
              alert("You are entered wrong deatils !!!")
            }
        
          }
            catch(e){
              console.log("error",e)
            }
    }
    
  return (
    <div className='container'>
      
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email"
                    onChange={handleChange}
                    name='email'
                    placeholder='enter your email...'
                    value={login.email}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password"
                    onChange={handleChange}
                    name='password'
                    placeholder='enter your password...'
                    value={login.password}
          />
        </div>
        <button type='submit'>Login</button>
        <span>
              don't have an account ?<Link to='/Signup'>Signup</Link>
        </span>
      </form>
    
      
    </div>     
  )
}

export default Login
