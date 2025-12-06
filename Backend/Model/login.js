const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const loginSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        validate(value){
            if(!validator.isAlpha(value)){
                throw new Error('Only alphabate are allowed',{})
            }
        }
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Enter valid email id',{})
            }
        }
    },
    password:{
        type:String,
        required:true,
        validate(value){
            if(value.lenght < 4){
                throw new Error('Password must be grether then 4',{})
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})

loginSchema.pre("save",async function(next){
    const temp = this
    if(temp.isModified("password")){
        temp.password = await bcrypt.hash(temp.password,10)
    }
    next()
})

loginSchema.statics.loginCheck = async function (email,password){
    console.log("ok")
    const temp = await this.findOne({email})
    // console.log(temp)
    if(!email){
        throw new Error("User not found")
    }
    const isMatch = await bcrypt.compare(password,temp.password)
    if(isMatch){
        console.log("ok1")
    }
    if(!isMatch){
        throw new Error("Incorrect password")
    }
    return temp
}

loginSchema.methods.generateToken = async function(){
    const loginForToken = this
    let token = jwt.sign({_id:loginForToken._id.toString()},'newtokencreated')

    loginForToken.tokens = await loginForToken.tokens.concat({token})
    await loginForToken.save()
    return token
}

const Login = mongoose.model('Login',loginSchema)
module.exports = Login