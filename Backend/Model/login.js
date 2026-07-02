const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const loginSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isAlpha(value.replace(/\s+/g, ''))) {
                throw new Error('Only alphabate are allowed', {})
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Enter valid email id', {})
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (value.length < 4) {
                throw new Error('Password must be greater than 4 characters', {})
            }
        }
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'coach', 'accountant'],
        default: 'admin'
    },
    profileImage: {
        type: String,
        default: ''
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

loginSchema.pre("save", async function (next) {
    const temp = this
    if (temp.isModified("password")) {
        temp.password = await bcrypt.hash(temp.password, 10)
    }
    next()
})

loginSchema.statics.loginCheck = async function (email, password) {
    console.log("ok")
    const temp = await this.findOne({ email })
    if (!temp) {
        throw new Error("User not found. Please check your email.")
    }
    const isMatch = await bcrypt.compare(password, temp.password)
    if (isMatch) {
        console.log("ok1")
    }
    if (!isMatch) {
        throw new Error("Incorrect password")
    }
    return temp
}

loginSchema.methods.generateToken = async function () {
    const loginForToken = this
    let token = jwt.sign({
        _id: loginForToken._id.toString(),
        role: loginForToken.role || 'admin'
    }, process.env.JWT_SECRET || 'newtokencreated')

    loginForToken.tokens = await loginForToken.tokens.concat({ token })
    await loginForToken.save()
    return token
}

const Login = mongoose.model('Login', loginSchema)
module.exports = Login