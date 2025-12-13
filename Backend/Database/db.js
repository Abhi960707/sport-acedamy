// This code only work vscode not work in deployement on any platform so commit keli
// const mongoose = require('mongoose')

// const URL = 'mongodb://127.0.0.1:27017/Login'
// const serverdb = mongoose.connect(URL)

// if(serverdb)
//     console.log('connected to DB')
// else
//     console.log('connection failed to DB')


//2
// const mongoose = require('mongoose');

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected Successfully"))
//   .catch((err) => console.log("DB Connection Failed:", err));

  
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.log('DB Connection Failed:', err.message);
  });
