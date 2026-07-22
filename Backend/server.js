require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const express  = require('express')
const port = 4005
const server = express()
const cors = require('cors')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')

const addgame = require('./Router/games')
const loginRouter = require('./Router/login')
const addcoach = require('./Router/coach')
const addplayers = require('./Router/players')
const rdd = require('./Router/reportgames')
const coach = require('./Router/reportcoach')
const players = require('./Router/reportplayers')
const audit = require('./Router/audit')
const attendance = require('./Router/attendance')
const forgotPassword = require('./Router/forgotPassword')
const uploadRouter = require('./Router/upload')
const paymentRouter = require('./Router/payment')
const settingsRouter = require('./Router/settings')
const notificationRouter = require('./Router/notification')
const superadminRouter = require('./Router/superadmin')
server.use(helmet({
    crossOriginResourcePolicy: false // Allow loading images statically
}))
server.use(cors())
server.use(express.json({ limit: '50mb' }))
server.use(express.urlencoded({ limit: '50mb', extended: true }))
// server.use(mongoSanitize()) // Incompatible with Express 5 req.query getter
server.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  //Routes
server.use(addgame)
server.use(loginRouter)
server.use(addcoach)
server.use(addplayers)
server.use(rdd)
server.use(coach)
server.use(players)
server.use(audit)
server.use(attendance)
server.use(forgotPassword)
server.use(uploadRouter)
server.use(paymentRouter)
server.use(settingsRouter)
server.use(notificationRouter)
server.use(superadminRouter)
//this is used mongoose connection 
require('./Database/db')
// like he hi normally ase aste MongoDB Connection

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log("DB Error:", err));

server.get('/',(req,res)=>{
    res.send({
        activeStatus:true,
        error:false,
    })
})

server.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const { logError } = require('./Utils/logger');
server.use((err, req, res, next) => {
    logError(err, 'Global Error Handler');
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
    });
});

const { initCronJobs } = require('./Utils/cronJobs');
const { initBackupJobs } = require('./Utils/backup');

//Start server yethun hote
initCronJobs();
initBackupJobs();
server.listen(port,(error)=>{
    if(error){
        console.log(error)
    }
    console.log(`server is running on ${port}`)
})





