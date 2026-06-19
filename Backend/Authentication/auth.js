const jwt = require('jsonwebtoken')
const Login = require('../Model/login')

const auth = async function(req, res, next) {
  const authHeader = req.header('Authorization');
  const loginToken = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!loginToken) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const empObj = jwt.verify(loginToken, process.env.JWT_SECRET || 'newtokencreated');
    const tempEmp = await Login.findOne({ _id: empObj._id, 'tokens.token': loginToken });

    if (!tempEmp) {
      return res.status(401).json({ success: false, message: 'Invalid token or user not found' });
    }

    req.currentEmp = tempEmp;
    req.token = loginToken;
    next();

  } catch (e) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};
module.exports = auth