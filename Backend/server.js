const express  = require('express')
const port = 4005
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
server.use(addgame)
server.use(loginRouter)
server.use(addcoach)
server.use(addplayers)
server.use(rdd)
server.use(coach)
server.use(players)

require('./Database/db')

server.get('/',(req,res)=>{
    res.send({
        activeStatus:true,
        error:false,
    })
})


server.listen(port,(error)=>{
    if(error){
        console.log(error)
    }
    console.log(`server is running on ${port}`)
})
