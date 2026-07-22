const fs = require('fs');
const path = require('path');

const routerPath = path.join(__dirname, 'Backend', 'Router');
const files = fs.readdirSync(routerPath).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(routerPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Add .lean() to find() queries that don't already have it, but ignore things like findOne, findById
    // Also handle cases with .sort(), .populate()
    // It's tricky to do a blind regex. A safer way is to specifically target common patterns.

    content = content.replace(/(\.find\([^)]*\))(?!\.lean)/g, '$1.lean()');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
