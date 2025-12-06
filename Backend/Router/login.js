const express = require('express')
const Login = require('../Model/login')
const router = new express.Router()
const auth = require('../Authentication/auth')

router.get('/login/test',async(req,res)=>{
    res.send({msg:"test router"})
})

router.post('/login/signup', async(req,res)=>{
    try{
        const templogin = new Login(req.body)
        await templogin.save()
        res.status(200).send({
            success:true,
            message:"Signup Successfully"
        })
    }
    catch(e){
        res.status(500).send({
            success:false,
            message:"some error",
            error: e.message
        })
    }
})

router.post('/login/login',async(req,res)=>{
    const {email, password}=req.body
    console.log(req.body)
    try{
        const userlogin = await Login.loginCheck(email,password)
        const token = await userlogin.generateToken()
        console.log(token)
        res.status(200).json({
            success:true,
            message:"login Successfully...",
            token
        })
    }
    catch(e){
        res.status(500).json({
            success:false,
            message:"login failed",error:e.message
        })
    }
})

router.post('/login/logout',auth, async(req,res)=>{
    // res.send("ok")
    try{
        req.currentEmp.tokens = req.currentEmp.tokens.filter((e)=>e.token!==req.token)
        await req.currentEmp.save()
        res.status(200).json({
            message:"logout Successfully..."
        })
    }
    catch(e){
        res.status(500).json({
        message:"Failed To log out...",error:e.message
        })
    }
})

module.exports = router