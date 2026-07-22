const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend/src/shared/forms');
['PaymentForm.jsx', 'AttendanceForm.jsx'].forEach(f => {
  const file = path.join(dir, f);
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/from '\.\/ExportDropdown'/g, "from '../components/ExportDropdown'");
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed ExportDropdown in forms');
