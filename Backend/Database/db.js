const mongoose = require('mongoose')

const URL = 'mongodb://127.0.0.1:27017/Login'
const serverdb = mongoose.connect(URL)

if(serverdb)
    console.log('connected to DB')
else
    console.log('connection failed to DB')