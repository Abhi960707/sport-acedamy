const jwt = require('jsonwebtoken')
const Login = require('../Model/login')

const auth = async function (req, res, next) {
  const authHeader = req.header('Authorization');
  const loginToken = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!loginToken) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const empObj = jwt.verify(loginToken, process.env.JWT_SECRET || 'newtokencreated');
    const tempEmp = await Login.findOne({ _id: empObj._id, 'tokens.token': loginToken });

    if (!tempEmp) {
      console.log('auth middleware 401: User not found with this token', { id: empObj._id, token: loginToken });
      return res.status(401).json({ success: false, message: 'Invalid token or user not found' });
    }

    req.currentEmp = tempEmp;
    req.userRole = tempEmp.role || 'admin';
    req.token = loginToken;

    if (req.userRole === 'admin') {
      req.academyOwnerId = tempEmp._id;
    } else if (req.userRole === 'coach') {
      const CoachModel = require('../Model/coach');
      const coachProfile = await CoachModel.findOne({ email: tempEmp.email.toLowerCase() });
      if (coachProfile) {
        req.coachProfile = coachProfile;
        req.academyOwnerId = coachProfile.owner || tempEmp.academyOwner;
      } else {
        req.academyOwnerId = tempEmp.academyOwner;
      }
    } else {
      req.academyOwnerId = tempEmp._id;
    }

    next();

  } catch (e) {
    console.log('auth middleware 401 error:', e.message);
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