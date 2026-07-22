const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend/src/Component');
['Login.jsx', 'Signup.jsx', 'Forgot.jsx'].forEach(f => {
  const file = path.join(dir, f);
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/from '\.\/Toast'/g, "from '../common/Toast'");
    content = content.replace(/from '\.\/access'/g, "from '../common/access'");
    content = content.replace(/from '\.\.\/api'/g, "from '../api'");
    fs.writeFileSync(file, content);
  }
});
console.log('Auth imports fixed');
