const fs = require('fs');
const path = require('path');

const routersDir = path.join(__dirname, 'Backend', 'Router');
const files = fs.readdirSync(routersDir).filter(f => f.endsWith('.js'));
let modifiedCount = 0;

files.forEach(file => {
    const filePath = path.join(routersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const originalContent = content;
    
    // Replace error: e.message with a safe internal server error message in production
    content = content.replace(/error:\s*e\.message/g, "error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message");
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        modifiedCount++;
        console.log('Hardened ' + file);
    }
});

console.log('Total files hardened: ' + modifiedCount);
