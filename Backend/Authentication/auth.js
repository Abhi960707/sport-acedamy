// const jwt = require('jsonwebtoken')
// const Login = require('../Model/login')

// const auth = async function(req, res, next) {
//   const loginToken = req.header('Authorization').replace('Bearer ', '');

//   if (!loginToken) {
//     return res.status(401).json({ success: false, message: 'No token provided' });
//   }

//   try {
//     const empObj = jwt.verify(loginToken, 'newtokencreated');
//     const tempEmp = await Login.findOne({ _id: empObj._id, 'tokens.token': loginToken });

//     if (!tempEmp) {
//       return res.status(401).json({ success: false, message: 'Invalid token or user not found' });
//     }

//     req.currentEmp = tempEmp;
//     req.token = loginToken;
//     next();

//   } catch (e) {
//     return res.status(401).json({ success: false, message: 'Authentication failed' });
//   }
// };
// module.exports = auth


const jwt = require('jsonwebtoken');
const Login = require('../Model/login');

const auth = async function (req, res, next) {
  try {
    const authHeader = req.header('Authorization');

    // ✅ Header check
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }

    const loginToken = authHeader.replace('Bearer ', '');

    const empObj = jwt.verify(loginToken, 'newtokencreated');

    const tempEmp = await Login.findOne({
      _id: empObj._id,
      'tokens.token': loginToken
    });

    if (!tempEmp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    req.currentEmp = tempEmp;
    req.token = loginToken;
    next();

  } catch (e) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = auth;
