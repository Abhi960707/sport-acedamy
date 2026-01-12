require('dotenv').config();
const mongoose = require('mongoose');

const express = require('express')
// const port = 4005
const port = process.env.PORT || 4005;
const server = express()
const cors = require('cors')

const addgame = require('./Router/games')
const loginRouter = require('./Router/login')
const addcoach = require('./Router/coach')
const addplayers = require('./Router/players')
const rdd = require('./Router/reportgames')
const coach = require('./Router/reportcoach')
const players = require('./Router/reportplayers')

server.use(cors())
server.use(express.json())

//Routes
server.use(addgame)
server.use(loginRouter) //change 
// server.use('/login',loginRouter)
server.use(addcoach)
server.use(addplayers)
server.use(rdd)
server.use(coach)
server.use(players)

//this is used mongoose connection 
require('./Database/db')
// like he hi normally ase aste MongoDB Connection

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log("DB Error:", err));


server.get('/', (req, res) => {
    res.send({
        activeStatus: true,
        error: false,
    })
})

//Start server yethun hote
server.listen(port, (error) => {
    if (error) {
        console.log(error)
    }
    console.log(`server is running on ${port}`)
})





