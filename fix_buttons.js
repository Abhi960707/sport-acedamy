const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'frontend', 'src', 'shared', 'components'),
    path.join(__dirname, 'frontend', 'src', 'shared', 'forms')
];

let totalUpdated = 0;

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Regex to find `<button` not followed immediately by ` type=` (with optional spaces).
        // It's safer to just do a string replace checking if `type="` exists in the tag.
        // Let's parse tag by tag using regex.
        
        let newContent = content.replace(/<button\b([^>]*)>/g, (match, attrs) => {
            if (!attrs.includes('type=')) {
                return `<button type="button"${attrs}>`;
            }
            return match;
        });

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${file}`);
            totalUpdated++;
        }
    });
});

console.log(`Total files updated: ${totalUpdated}`);
