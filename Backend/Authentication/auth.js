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
    req.userRole = tempEmp.role || 'admin';
    req.token = loginToken;
    next();

  } catch (e) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

auth.allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.currentEmp) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const currentRole = req.currentEmp.role || 'admin';
    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  };
};

module.exports = auth