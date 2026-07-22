const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function fixImports(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const inShared = filePath.includes(path.join('shared', 'components')) || filePath.includes(path.join('shared', 'forms'));
  const inCommon = filePath.includes('common');
  const inRoles = filePath.includes('roles');

  if (inShared) {
    content = content.replace(/from '\.\/Toast'/g, "from '../../common/Toast'");
    content = content.replace(/from '\.\/access'/g, "from '../../common/access'");
    content = content.replace(/from '\.\/reportExport'/g, "from '../../common/reportExport'");
    content = content.replace(/from '\.\.\/api'/g, "from '../../api'");
    content = content.replace(/from '\.\/ExportDropdown'/g, "from './ExportDropdown'");
  }

  if (inCommon) {
    content = content.replace(/from '\.\/Toast'/g, "from './Toast'");
    content = content.replace(/from '\.\/access'/g, "from './access'");
    content = content.replace(/from '\.\/reportExport'/g, "from './reportExport'");
    content = content.replace(/from '\.\.\/api'/g, "from '../api'");
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

['shared', 'common'].forEach(d => {
  const p = path.join(srcDir, d);
  if (fs.existsSync(p)) walkDir(p, fixImports);
});
console.log('Imports fixed.');
