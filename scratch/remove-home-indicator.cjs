const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(file, 'utf8');
      
      const modified = content.replace(/\s*<div class="[^"]*flex justify-center[^"]*">\s*<span class="h-1 w-32 rounded-full bg-gray-900\/80 dark:bg-white\/60"><\/span>\s*<\/div>/g, '');

      if (content !== modified) {
        fs.writeFileSync(file, modified, 'utf8');
        console.log('Fixed', file);
      }
    }
  });
}

walk('registry/apps');
