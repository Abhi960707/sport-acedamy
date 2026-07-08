const fs = require('fs');
const path = require('path');

const routersDir = 'e:\\\\Mern\\\\Projects\\\\sport acedamy\\\\sport acedamy\\\\Backend\\\\Router';
const files = fs.readdirSync(routersDir).filter(f => f.endsWith('.js') && f !== 'login.js' && f !== 'audit.js');

for (const file of files) {
    const filePath = path.join(routersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the specific old filter
    content = content.replace(/const filter = \['superadmin', 'coach', 'accountant'\]\.includes\(req\.userRole\) \? \{\} : \{ ?owner: ?req\.currentEmp\._id ?\};/g, 
                              "const filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };");

    // Replace other specific filters
    content = content.replace(/const filter = req\.userRole === 'superadmin' \? \{ _id: req\.params\.id \} : \{ _id: req\.params\.id, owner: req\.currentEmp\._id \};/g,
                              "const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };");

    content = content.replace(/const filter = req\.userRole === 'superadmin' \? \{ playerId \} : \{ playerId, owner: req\.currentEmp\._id \};/g,
                              "const filter = req.userRole === 'superadmin' ? { playerId } : { playerId, owner: req.academyOwnerId };");
                              
    content = content.replace(/const filter = \['superadmin', 'coach', 'accountant'\]\.includes\(req\.userRole\) \? \{ _id: playerId \} : \{ _id: playerId, owner: req\.currentEmp\._id \};/g,
                              "const filter = req.userRole === 'superadmin' ? { _id: playerId } : { _id: playerId, owner: req.academyOwnerId };");                          

    // Replace plain owner assignment
    content = content.replace(/owner: req\.currentEmp\._id/g, "owner: req.academyOwnerId");

    fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Updated routers!");
