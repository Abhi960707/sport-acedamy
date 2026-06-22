// This code only work vscode not work in deployement on any platform so commit keli

// const mongoose = require('mongoose');

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected Successfully"))
//   .catch((err) => console.log("DB Connection Failed:", err));


// Changed this code
// const mongoose = require('mongoose')

// const URL = 'mongodb://127.0.0.1:27017/Login'
// const serverdb = mongoose.connect(URL)

// if(serverdb)
//     console.log('connected to DB')
// else
//     console.log('connection failed to DB')

// const mongoose = require("mongoose");
// console.log("URI =", process.env.MONGO_URI);
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("Connected to MongoDB Atlas"))
//   .catch((err) => console.log("DB Connection Failed:", err));


  const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/sportAcademy')
  .then(() => console.log('Connected to MongoDB '))
  .catch(err => console.log('DB Connection Failed:', err));